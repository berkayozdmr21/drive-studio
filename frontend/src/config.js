import VEHICLES from '../vehicles.json';
export {VEHICLES};
export const getVehicle=(config)=>VEHICLES.find(v=>v.id===config.vehicle)||VEHICLES[0];
export const DEFAULT_CONFIG={vehicle:'458-study',color:'copper',wheels:'forged',interior:'saddle',finish:'gloss',package:'studio'};
export const CATALOG={
  vehicles:VEHICLES,
  model:{id:'458-study',name:'458 Italia',base_price:219000,currency:'EUR'},
  colors:[{id:'copper',name:'Burnished Copper',hex:'#af7351',price:3600,description:'Sıcak metalik pigment. Işıkla değişen karakter.'},{id:'graphite',name:'Obsidian Grey',hex:'#373c3c',price:2400,description:'Derin grafit. Zamansız ve kararlı.'},{id:'pearl',name:'Porcelain White',hex:'#e8e5db',price:2400,description:'Sedefli beyaz. Heykelsi çizgileri ortaya çıkarır.'},{id:'green',name:'Forest Atelier',hex:'#254d42',price:3600,description:'Orman yeşili. Sakinliğin güçlü tonu.'},{id:'red',name:'Rosso Study',hex:'#a62424',price:0,description:'Klasik kırmızı. Yolun ritmine bir selam.'}],
  wheels:[{id:'forged',name:'Forged 5',description:'Orijinal beş kol · Fırçalanmış gümüş',price:0,color:'#aeb1b1'},{id:'turbine',name:'Aero 12',description:'On iki kol · Saten grafit',price:2800,color:'#55595a'},{id:'split',name:'Atelier 7',description:'Yedi kol · Sıcak bronz',price:2100,color:'#a4855e'}],
  interiors:[{id:'saddle',name:'Saddle Tan',hex:'#a16e49',price:1800},{id:'onyx',name:'Onyx Black',hex:'#181b1d',price:0}],
  finishes:[{id:'gloss',name:'Gloss Metallic',description:'Işığı yakalayan parlak katman.',price:0},{id:'satin',name:'Satin Finish',description:'Yumuşak yansıma, dokunsal görünüm.',price:4200}],
  packages:[{id:'studio',name:'Studio Edition',description:'Sade gövde, standart karbon detaylar.',price:0},{id:'performance',name:'Aero Study',description:'Özel arka kanat, koyu karbon detaylar.',price:8900}]
};
export const money=value=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
export function estimate(config,catalog=CATALOG){const groups={color:'colors',wheels:'wheels',interior:'interiors',finish:'finishes',package:'packages'};return getVehicle(config).base_price+Object.entries(groups).reduce((sum,[key,group])=>sum+(catalog[group].find(o=>o.id===config[key])?.price||0),0);}
export function validConfig(value,catalog=CATALOG){const keys={color:'colors',wheels:'wheels',interior:'interiors',finish:'finishes',package:'packages'};const vehicle=value?.vehicle||'458-study';return value&&VEHICLES.some(v=>v.id===vehicle)&&Object.entries(keys).every(([key,group])=>catalog[group].some(o=>o.id===value[key]))?{vehicle,...Object.fromEntries(Object.keys(keys).map(key=>[key,value[key]]))}:null;}
export async function api(path,body,method){const options=body===undefined&&!method?{}:{method:method||'POST',headers:{'Content-Type':'application/json','X-Studio-Client':'drive-studio'},...(body!==undefined?{body:JSON.stringify(body)}:{})};const response=await fetch('/api'+path,options);if(!response.ok){let message='İşlem tamamlanamadı ('+response.status+')';try{const result=await response.json();if(typeof result.detail==='string')message=result.detail;}catch{}throw new Error(message);}return response.status===204?null:response.json();}
