import React,{Suspense,useMemo,useEffect,useRef,useState,Component} from 'react';
import {Canvas,useThree,useFrame} from '@react-three/fiber';
import {OrbitControls,ContactShadows,useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {CATALOG,getVehicle} from './config';
import ConceptCar from './ConceptCar';
import ConceptPoster from './ConceptPoster';
import {exportDimensions} from './render';
function ReadyConcept({onReady,...props}){useEffect(()=>{onReady(true);return()=>onReady(false);},[onReady]);return <ConceptCar {...props}/>;}


const POSITIONS={studio:[-5.8,2.15,-6.3],front:[0,1.35,-7.8],side:[-7.8,1.75,.25],rear:[5.3,2,6.2],detail:[-3.8,1.15,-2.2]};
const WHEELS=[[-.9564,.358,-1.1553],[.9425,.3607,-1.1545],[-.9466,.358,1.495],[.9496,.358,1.4963]];

export function CarPoster({config,caption='3D stüdyo hazırlanıyor'}){
 const vehicle=getVehicle(config);if(vehicle.kind!=='asset')return <ConceptPoster vehicle={vehicle} config={config} caption={caption}/>;const color=CATALOG.colors.find(c=>c.id===config.color)?.hex||'#af7351';
 return <div className="car-poster"><svg viewBox="0 0 900 410" role="img" aria-label="Otomobilin iki boyutlu önizlemesi"><defs><linearGradient id="paint" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e2c3a7"/><stop offset=".38" stopColor={color}/><stop offset="1" stopColor="#2d2520"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a5b2aa"/><stop offset="1" stopColor="#1c2526"/></linearGradient><radialGradient id="rim"><stop stopColor="#b6bbb7"/><stop offset=".3" stopColor="#323938"/><stop offset=".8" stopColor="#777f7b"/><stop offset="1" stopColor="#202525"/></radialGradient></defs><ellipse cx="450" cy="335" rx="370" ry="24" fill="#050606" opacity=".45"/><path d="M65 270 Q80 238 151 228 L295 205 Q355 128 444 133 Q525 135 600 191 L740 207 Q805 221 832 263 L821 302 L767 312 Q761 245 699 243 Q636 242 623 310 L291 318 Q283 252 222 252 Q162 250 153 316 L83 304Z" fill="url(#paint)" stroke="#bba28a" strokeOpacity=".3"/><path d="M320 201 Q362 145 443 146 Q516 146 567 191 L487 199Z" fill="url(#glass)" stroke="#4b5552" strokeWidth="3"/><path d="M433 146 L445 198 M306 212 L598 201 L595 279 L310 290Z" fill="none" stroke="#282924" strokeWidth="2"/><path d="M86 267 L166 255 L138 276 L78 281" fill="#d4e5dc"/><path d="M760 240 L810 251 L814 269 L766 258" fill="#a43929"/><path d="M347 290 L585 274 L621 299 L320 309" fill="#252724" opacity=".6"/>{[222,699].map(cx=><g key={cx}><circle cx={cx} cy="302" r="57" fill="#0b0e0d"/><circle cx={cx} cy="302" r="43" fill="url(#rim)"/>{Array.from({length:config.wheels==='turbine'?12:config.wheels==='split'?7:5},(_,i)=><line key={i} x1={cx} y1="302" x2={cx+Math.cos(i*Math.PI*2/(config.wheels==='turbine'?12:config.wheels==='split'?7:5))*37} y2={302+Math.sin(i*Math.PI*2/(config.wheels==='turbine'?12:config.wheels==='split'?7:5))*37} stroke={config.wheels==='split'?'#a4855e':'#acb2ae'} strokeWidth="7"/>)}<circle cx={cx} cy="302" r="9" fill="#323734"/></g>)}</svg><span>{vehicle.name} · {caption}</span></div>;
}

function CustomWheel({position,type}){
 const count=type==='turbine'?12:7,color=type==='turbine'?'#50585a':'#a4855e';
 return <group position={position}><mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.244,.017,12,48]}/><meshStandardMaterial color={color} metalness={.92} roughness={.24}/></mesh>{Array.from({length:count},(_,i)=>{const angle=i/count*Math.PI*2;return <mesh key={i} position={[0,Math.cos(angle)*.126,Math.sin(angle)*.126]} rotation={[angle,0,0]} castShadow><boxGeometry args={[.05,.235,type==='turbine'?.027:.04]}/><meshStandardMaterial color={color} metalness={.92} roughness={.25}/></mesh>})}<mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.058,.058,.065,24]}/><meshStandardMaterial color="#303636" metalness={.85} roughness={.26}/></mesh></group>;
}

function Car({config,lights,onReady,reduced}){
 const gltf=useGLTF('/models/ferrari.glb','/draco/');
 const scene=useMemo(()=>{const clone=gltf.scene.clone(true);clone.traverse(node=>{if(node.isMesh){node.material=node.material.clone();node.castShadow=true;node.receiveShadow=true;}});return clone;},[gltf.scene]);
 const body=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#af7351',metalness:.92,roughness:.24,clearcoat:1,clearcoatRoughness:.14}),[]);
 const target=useMemo(()=>new THREE.Color(CATALOG.colors.find(c=>c.id===config.color).hex),[config.color]);
 useEffect(()=>{scene.getObjectByName('body').material=body;onReady(true);return()=>onReady(false);},[scene,body,onReady]);
 useEffect(()=>{scene.traverse(node=>{if(!node.isMesh)return;if(node.name==='glass'){node.material.color.set('#6e7774');node.material.transparent=true;node.material.opacity=.42;node.material.depthWrite=false;node.material.roughness=.06;node.material.metalness=.12;}if(['leather','interior_light'].includes(node.name))node.material.color.set(config.interior==='saddle'?'#a16e49':'#15191b');if(node.name.startsWith('rim_')){node.visible=config.wheels==='forged';node.material.color.set('#aeb1b1');node.material.metalness=.95;node.material.roughness=.24;}if(node.name==='carbon_fibre_trim'||node.name==='carbon fibre'){node.material.color.set(config.package==='performance'?'#101414':'#303332');node.material.roughness=.45;}if(['leds','lights'].includes(node.name)){node.material.emissive.set('#e8f4ed');node.material.emissiveIntensity=lights?2:0;}if(node.name==='lights_red'){node.material.emissive.set('#cf3026');node.material.emissiveIntensity=lights?.6:0;}});},[scene,config.interior,config.wheels,config.package,lights]);
 useFrame((_,delta)=>{body.color.lerp(target,reduced?1:1-Math.exp(-delta*6));const rough=config.finish==='satin'?.57:.24;body.roughness=reduced?rough:THREE.MathUtils.damp(body.roughness,rough,5,delta);body.clearcoat=config.finish==='satin'?.15:1;});
 useEffect(()=>()=>{body.dispose();scene.traverse(node=>{if(node.isMesh&&node.material!==body)node.material.dispose();});},[body,scene]);
 return <group position={[0,.005,0]}><primitive object={scene}/>{config.wheels!=='forged'&&WHEELS.map((position,i)=><CustomWheel key={i} position={position} type={config.wheels}/>)}{config.package==='performance'&&<group position={[0,.85,1.94]}><mesh castShadow><boxGeometry args={[1.65,.055,.32]}/><meshStandardMaterial color="#171d1c" metalness={.5} roughness={.4}/></mesh>{[-.5,.5].map(x=><mesh key={x} position={[x,-.14,.03]} castShadow><boxGeometry args={[.035,.28,.13]}/><meshStandardMaterial color="#222827" metalness={.7} roughness={.3}/></mesh>)}</group>}{lights&&[-.65,.65].map(x=><spotLight key={x} position={[x,.5,-1.92]} rotation={[Math.PI/2,0,0]} color="#d6e9d9" angle={.48} penumbra={1} intensity={6} distance={5}/>)}</group>;
}

function Studio({theme,view,resetKey,scrollProgress,reduced,onManual,onCapture,config,lights,onReady,autoRotate}){
 const {gl,scene,camera,invalidate}=useThree();const controls=useRef();const [modelReady,setModelReady]=useState(false);const handleReady=React.useCallback(value=>{setModelReady(value);onReady(value);},[onReady]);
 const manual=useRef(false),lastView=useRef(view),lastKey=useRef(resetKey);
 const desired=useMemo(()=>new THREE.Vector3(),[]);
 useEffect(()=>{const pmrem=new THREE.PMREMGenerator(gl);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=theme==='light'?1.35:.9;return()=>{scene.environment=null;environment.dispose();room.dispose();pmrem.dispose();};},[gl,scene,theme]);
 useEffect(()=>{onCapture((options={})=>{
  const oldSize=gl.getSize(new THREE.Vector2()),oldRatio=gl.getPixelRatio(),oldAspect=camera.aspect;
  const {width,height}=exportDimensions(options.width||Math.round(oldSize.x),oldAspect,gl.capabilities.maxTextureSize);
  const hidden=[];try{
   if(options.transparent)scene.traverse(node=>{if(node.name==='studio-floor'||node.name==='studio-contact-shadow'){hidden.push([node,node.visible]);node.visible=false;}});
   gl.setPixelRatio(1);gl.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();gl.render(scene,camera);
   const out=document.createElement('canvas');out.width=width;out.height=height+100;const ctx=out.getContext('2d');if(!ctx)throw new Error('PNG oluşturulamadı.');
   if(!options.transparent){ctx.fillStyle=theme==='light'?'#dfded4':'#161914';ctx.fillRect(0,0,out.width,out.height);}ctx.drawImage(gl.domElement,0,0);
   ctx.fillStyle=options.transparent?'#55605a':theme==='light'?'#31372f':'#c2bca9';ctx.font='22px system-ui';ctx.fillText('DRIVE STUDIO / '+getVehicle(config).name.toUpperCase()+' — INDEPENDENT DESIGN STUDY',24,height+35);ctx.font='14px system-ui';
   ctx.fillText(getVehicle(config).kind==='asset'?'Model: vicent091036 · CC BY 4.0 · sketchfab.com/models/57bf6cc56931426e87494f554df1dab6':'Original procedural concept · Drive Studio',24,height+66);
   return out.toDataURL('image/png');
  }finally{hidden.forEach(([node,visible])=>{node.visible=visible;});gl.setPixelRatio(oldRatio);gl.setSize(oldSize.x,oldSize.y,false);camera.aspect=oldAspect;camera.updateProjectionMatrix();gl.render(scene,camera);}
 });return()=>onCapture(null);},[gl,scene,camera,onCapture,theme,config.vehicle]);

 useFrame((_,delta)=>{if(lastView.current!==view||lastKey.current!==resetKey){manual.current=false;lastView.current=view;lastKey.current=resetKey;}if(!manual.current&&!autoRotate){const goal=POSITIONS[view]||POSITIONS.studio;desired.fromArray(goal);if(view==='studio'){desired.lerp(new THREE.Vector3(-7.2,1.65,.6),Math.min((scrollProgress?.current||0)*.55,.55));}const distance=camera.position.distanceTo(desired);if(reduced)camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-delta*3));if(controls.current)controls.current.target.set(0,.65,.1);if(distance>.005)invalidate();}});
 return <><ambientLight intensity={theme==='light'?.7:.4}/><directionalLight position={[-3,7,-4]} intensity={theme==='light'?3:2.1} color="#fff5e5" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-.001}/><directionalLight position={[4,3,3]} intensity={2.8} color="#b1c8cd"/><directionalLight position={[0,4,-5]} intensity={1.1} color="#e9b68b"/><Suspense fallback={null}>{getVehicle(config).kind==='asset'?<Car config={config} lights={lights} onReady={handleReady} reduced={reduced}/>:<ReadyConcept vehicle={getVehicle(config)} config={config} lights={lights} onReady={handleReady}/>}</Suspense><mesh name="studio-floor" rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={theme==='light'?'#bcbdb2':'#1a1e19'} roughness={.62} metalness={.08}/></mesh>{modelReady&&<ContactShadows name="studio-contact-shadow" key={config.wheels+config.package} position={[0,0,0]} opacity={.6} scale={13} blur={2.7} far={3} resolution={512} frames={1} color="#000000"/>}<OrbitControls ref={controls} makeDefault target={[0,.65,.1]} enablePan={false} minDistance={3.3} maxDistance={10} minPolarAngle={.58} maxPolarAngle={1.53} enableDamping={!reduced} dampingFactor={.07} rotateSpeed={.5} autoRotate={autoRotate&&!reduced} autoRotateSpeed={.5} onStart={()=>{manual.current=true;onManual();}}/></>;
}

class SceneBoundary extends Component{
 constructor(props){super(props);this.state={failed:false};}
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onFailure?.();}
 render(){return this.state.failed?<CarPoster config={this.props.config} caption="2D önizleme · 3D yüklenemedi"/>:this.props.children;}
}

export default function CarScene(props){
 const [ready,setReady]=useState(false),[available]=useState(()=>{try{const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2');if(context){context.getExtension('WEBGL_lose_context')?.loseContext();return true;}return false;}catch{return false;}});
 const onReady=React.useCallback(value=>{setReady(value);props.onReady?.(value);},[props.onReady]);
 if(!available)return <CarPoster config={props.config} caption="2D önizleme · WebGL 2 bu cihazda kullanılamıyor"/>;
 return <SceneBoundary config={props.config} onFailure={()=>onReady(false)}><div className={'webgl-scene '+(ready?'is-ready':'')}><Canvas shadows dpr={[1,1.75]} camera={{position:POSITIONS.studio,fov:35,near:.1,far:100}} gl={{antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.25;gl.setClearColor(0,0);}}><Studio {...props} onReady={onReady}/></Canvas></div>{!ready&&<CarPoster config={props.config}/>}</SceneBoundary>;
}
