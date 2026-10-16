import json
import os
import re
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from fastapi import FastAPI,Request,Response,HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field,ConfigDict

ROOT=Path(os.path.abspath(__file__)).parents[1]
DATA=Path(os.getenv('DRIVE_DATA_DIR',str(ROOT/'data')))
DATA.mkdir(parents=True,exist_ok=True)
DB=DATA/'studio.sqlite3'
CATALOG={
    'model':{'id':'458-study','name':'458 Italia','subtitle':'Independent design study','base_price':219000,'currency':'EUR'},
    'colors':[
        {'id':'copper','name':'Burnished Copper','hex':'#af7351','price':3600,'description':'Sıcak metalik pigment. Işıkla değişen karakter.'},
        {'id':'graphite','name':'Obsidian Grey','hex':'#373c3c','price':2400,'description':'Derin grafit. Zamansız ve kararlı.'},
        {'id':'pearl','name':'Porcelain White','hex':'#e8e5db','price':2400,'description':'Sedefli beyaz. Heykelsi çizgileri ortaya çıkarır.'},
        {'id':'green','name':'Forest Atelier','hex':'#254d42','price':3600,'description':'Orman yeşili. Sakinliğin güçlü tonu.'},
        {'id':'red','name':'Rosso Study','hex':'#a62424','price':0,'description':'Klasik kırmızı. Yolun ritmine bir selam.'}
    ],
    'wheels':[
        {'id':'forged','name':'Forged 5','description':'Orijinal beş kollu geometri · Fırçalanmış gümüş','price':0,'color':'#aeb1b1'},
        {'id':'turbine','name':'Aero 12','description':'On iki kollu özel geometri · Saten grafit','price':2800,'color':'#55595a'},
        {'id':'split','name':'Atelier 7','description':'Yedi kollu özel geometri · Sıcak bronz','price':2100,'color':'#a4855e'}
    ],
    'interiors':[
        {'id':'saddle','name':'Saddle Tan','hex':'#a16e49','price':1800},
        {'id':'onyx','name':'Onyx Black','hex':'#181b1d','price':0}
    ],
    'finishes':[
        {'id':'gloss','name':'Gloss Metallic','description':'Işığı yakalayan parlak katman.','price':0},
        {'id':'satin','name':'Satin Finish','description':'Yumuşak yansıma, dokunsal görünüm.','price':4200}
    ],
    'packages':[
        {'id':'studio','name':'Studio Edition','description':'Sade gövde, standart karbon detaylar.','price':0},
        {'id':'performance','name':'Aero Study','description':'Özel arka kanat, koyu karbon detaylar.','price':8900}
    ]
}


VEHICLES=json.loads((ROOT/'frontend/vehicles.json').read_text(encoding='utf-8'))
CATALOG['vehicles']=VEHICLES

class Configuration(BaseModel):
    model_config=ConfigDict(extra='forbid')
    vehicle: Literal['458-study','apex','volt','terra','metro','nomad','aero','coast','trail','atlas']='458-study'
    color: Literal['copper','graphite','pearl','green','red']='copper'
    wheels: Literal['forged','turbine','split']='forged'
    interior: Literal['saddle','onyx']='saddle'
    finish: Literal['gloss','satin']='gloss'
    package: Literal['studio','performance']='studio'


class SaveDesign(BaseModel):
    model_config=ConfigDict(extra='forbid')
    title: str=Field(default='Untitled Study',min_length=1,max_length=60)
    configuration: Configuration


@contextmanager
def database():
    db=sqlite3.connect(DB,timeout=20);db.row_factory=sqlite3.Row
    try:
        with db:yield db
    finally:db.close()


with database() as db:
    db.execute('CREATE TABLE IF NOT EXISTS designs(id TEXT PRIMARY KEY, owner TEXT, title TEXT, configuration TEXT, created_at REAL)')
    db.execute('CREATE INDEX IF NOT EXISTS design_owner ON designs(owner)')

app=FastAPI(title='Drive Studio API',version='1.0.0')
COOKIE='drive_studio_owner'


@app.middleware('http')
async def secure_mutation(request:Request,call_next):
    if request.method in ['POST','PUT','PATCH','DELETE'] and request.url.path.startswith('/api/'):
        origin=request.headers.get('origin')
        if origin and urlparse(origin).netloc!=request.headers.get('host'):
            return JSONResponse({'detail':'Cross-origin writes are blocked.'},status_code=403)
        if request.headers.get('x-studio-client')!='drive-studio':
            return JSONResponse({'detail':'Studio client header required.'},status_code=403)
    return await call_next(request)


def owner(request):
    value=request.cookies.get(COOKIE,'')
    if not re.fullmatch(r'[a-f0-9]{64}',value):raise HTTPException(401,'Önce yerel stüdyo oturumunu başlatın.')
    return value


def quote(configuration):
    config=configuration.model_dump() if isinstance(configuration,Configuration) else configuration
    fields={'color':'colors','wheels':'wheels','interior':'interiors','finish':'finishes','package':'packages'}
    vehicle=next(v for v in VEHICLES if v['id']==config.get('vehicle','458-study'))
    items=[{'id':'base','name':vehicle['name']+' · Design Study','price':vehicle['base_price']}]
    for key,collection in fields.items():
        option=next(o for o in CATALOG[collection] if o['id']==config[key])
        items.append({'id':key,'name':option['name'],'price':option['price']})
    return {'currency':'EUR','total':sum(i['price'] for i in items),'items':items,'demo':True,'notice':'Tasarım deneyimi için örnek fiyatlandırma. Gerçek araç, opsiyon veya satış teklifi değildir.'}


def serialized(row):
    config=json.loads(row['configuration'])
    return {'id':row['id'],'title':row['title'],'configuration':config,'created_at':row['created_at'],'quote':quote(config)}


@app.get('/api/health')
def health():return {'status':'ok','mode':'design-demo'}


@app.get('/api/catalog')
def catalog():return CATALOG


@app.get('/api/session')
def session(request:Request,response:Response):
    value=request.cookies.get(COOKIE,'')
    if not re.fullmatch(r'[a-f0-9]{64}',value):
        value=secrets.token_hex(32)
        response.set_cookie(COOKIE,value,httponly=True,samesite='lax',secure=request.url.scheme=='https',max_age=365*24*3600)
    response.headers['Cache-Control']='no-store'
    return {'status':'ready','anonymous':True}


@app.post('/api/quote')
def calculate(body:Configuration):return quote(body)


@app.get('/api/designs')
def list_designs(request:Request):
    with database() as db:
        rows=db.execute('SELECT * FROM designs WHERE owner=? ORDER BY created_at DESC',(owner(request),)).fetchall()
    return [serialized(row) for row in rows]


@app.post('/api/designs',status_code=201)
def save(body:SaveDesign,request:Request):
    title=body.title.strip()
    if not title:raise HTTPException(422,'Tasarım adı boş olamaz.')
    token=owner(request);design_id=uuid.uuid4().hex
    with database() as db:
        if db.execute('SELECT COUNT(*) FROM designs WHERE owner=?',(token,)).fetchone()[0]>=100:
            raise HTTPException(409,'En fazla 100 tasarım saklanabilir. Eski tasarımlardan birini silin.')
        db.execute('INSERT INTO designs VALUES(?,?,?,?,?)',(design_id,token,title,json.dumps(body.configuration.model_dump()),time.time()))
        row=db.execute('SELECT * FROM designs WHERE id=?',(design_id,)).fetchone()
    return serialized(row)


@app.get('/api/designs/{design_id}')
def public_design(design_id:str):
    with database() as db:row=db.execute('SELECT * FROM designs WHERE id=?',(design_id,)).fetchone()
    if not row:raise HTTPException(404,'Tasarım bulunamadı veya silinmiş.')
    return serialized(row)


@app.delete('/api/designs/{design_id}',status_code=204)
def delete_design(design_id:str,request:Request):
    with database() as db:
        changed=db.execute('DELETE FROM designs WHERE id=? AND owner=?',(design_id,owner(request))).rowcount
    if not changed:raise HTTPException(404,'Bu oturumda tasarım bulunamadı.')


static=ROOT/'frontend/dist'
if static.exists():app.mount('/',StaticFiles(directory=static,html=True),name='frontend')
else:
    @app.get('/')
    def build_missing():return {'message':'Frontend build gerekli. BASLAT.cmd kullanın.'}
