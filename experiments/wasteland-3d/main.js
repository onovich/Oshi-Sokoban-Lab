import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeWorld, stepWorld, confineTarget } from './physics.js';
import collision from './assets/collision.json';
import './style.css';

const $ = id => document.getElementById(id);
const cfg = { projection: 'ortho', behavior: 'fixed', yaw: 45, pitch: 35.264, size: 12.5, distance: 23, fov: 45,
  damping: .25, deadX: .16, deadY: .16, guides: false, confiner: false, confineMode: 'target', boundX: 12, boundZ: 10,
  speed: 1.5, motion: 'auto', cameraRelative: true };
const scene = new THREE.Scene();
scene.background = new THREE.Color('#8b9892');
scene.fog = new THREE.Fog('#8b9892', 46, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
$('viewport').append(renderer.domElement);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 150);
const perspective = new THREE.PerspectiveCamera(45, 1, .1, 150);
let camera = ortho, aspect = 1;
const target = new THREE.Vector3(0, 0, 0);
scene.add(new THREE.HemisphereLight('#e0e9df', '#4b4540', 2.2));
const sun = new THREE.DirectionalLight('#ffe1b4', 3.6);
sun.position.set(-12, 22, 9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);sun.shadow.camera.left=-19;sun.shadow.camera.right=19;
sun.shadow.camera.top=19;sun.shadow.camera.bottom=-19;sun.shadow.camera.far=65;
sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:'#7d8980',roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.73;ground.receiveShadow=true;scene.add(ground);
let world = makeWorld(collision), actor, mixer, currentAction, state='Idle';
const actorRoot = new THREE.Group();scene.add(actorRoot);
const actions = {}, crateMeshes = [];
const keys = new Set();
let elapsed = 0, frames=0, fpsTime=0, last=performance.now(), ready=false;
let demo=false;
const marker = new THREE.Mesh(new THREE.RingGeometry(.34,.38,40),new THREE.MeshBasicMaterial({color:'#e6c06c',transparent:true,opacity:.72,side:THREE.DoubleSide}));
marker.rotation.x=-Math.PI/2;marker.position.y=.035;scene.add(marker);
const boundary = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:'#e9bd66'}));scene.add(boundary);
const targetMarker = new THREE.Mesh(new THREE.RingGeometry(.10,.14,24),new THREE.MeshBasicMaterial({color:'#70e0dc',side:THREE.DoubleSide}));
targetMarker.rotation.x=-Math.PI/2;targetMarker.position.y=.06;scene.add(targetMarker);
const footprint = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:'#79ced1',transparent:true,opacity:.7}));scene.add(footprint);
const raycaster = new THREE.Raycaster();const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);

function poseCamera() {
  camera = cfg.projection === 'ortho' ? ortho : perspective;
  const yaw=THREE.MathUtils.degToRad(cfg.yaw),pitch=THREE.MathUtils.degToRad(cfg.pitch);
  const d=cfg.projection==='ortho'?35:cfg.distance;
  camera.position.set(target.x + Math.sin(yaw)*Math.cos(pitch)*d, Math.sin(pitch)*d, target.z + Math.cos(yaw)*Math.cos(pitch)*d);
  camera.lookAt(target); camera.updateMatrixWorld(true);
  ortho.left=-cfg.size*aspect;ortho.right=cfg.size*aspect;ortho.top=cfg.size;ortho.bottom=-cfg.size;ortho.updateProjectionMatrix();
  perspective.aspect=aspect;perspective.fov=cfg.fov;perspective.updateProjectionMatrix();
}
function groundOffsets() {
  const points=[];
  for(const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
    raycaster.setFromCamera(new THREE.Vector2(x,y),camera);
    const p=raycaster.ray.intersectPlane(plane,new THREE.Vector3());
    if(!p || p.distanceTo(camera.position)>500) return null;
    points.push({x:p.x-target.x,z:p.z-target.z});
  }
  return points;
}
function updateCamera(dt) {
  poseCamera();
  if(cfg.behavior==='follow' && ready) {
    // Screen-space dead zone, projected onto the ground at the actor's feet.
    const p=new THREE.Vector3(world.player.x,0,world.player.z).project(camera);
    const x=THREE.MathUtils.clamp(p.x,-cfg.deadX,cfg.deadX),y=THREE.MathUtils.clamp(p.y,-cfg.deadY,cfg.deadY);
    raycaster.setFromCamera(new THREE.Vector2(x,y),camera);
    const edge=raycaster.ray.intersectPlane(plane,new THREE.Vector3());
    if(edge) {
      const a=cfg.damping===0?1:1-Math.exp(-dt/cfg.damping);
      target.x+=(world.player.x-edge.x)*a;target.z+=(world.player.z-edge.z)*a;
      poseCamera();
    }
  }
  let fits=true;
  if(cfg.confiner) {
    const offsets=cfg.confineMode==='viewport'?groundOffsets():[{x:0,z:0}];
    if(offsets) {
      const result=confineTarget(target,cfg.boundX,cfg.boundZ,offsets);
      target.x=result.x;target.z=result.z;fits=result.fits;
    } else fits=false;
    poseCamera();
  }
  const message=!cfg.confiner?'边界未启用。':fits?(cfg.confineMode==='target'?'观察中心限制在金色矩形内。':'可见地面限制在金色矩形内。'):'当前视野超出边界，无法完全收纳。请缩小视野、提高俯仰角或扩大边界。';
  $('confiner-status').textContent=message;$('confiner-status').classList.toggle('warning',!fits);
  targetMarker.position.set(target.x,.055,target.z);targetMarker.visible=cfg.guides;
  boundary.visible=cfg.guides && cfg.confiner;footprint.visible=cfg.guides && cfg.confiner && cfg.confineMode==='viewport';
  if(footprint.visible) {
    const offsets=groundOffsets();
    if(offsets){footprint.geometry.dispose();footprint.geometry=new THREE.BufferGeometry().setFromPoints(offsets.map(p=>new THREE.Vector3(p.x+target.x,.065,p.z+target.z)));}
    else footprint.visible=false;
  }
}
function resize(){const r=$('stage').getBoundingClientRect();aspect=r.width/r.height;renderer.setSize(r.width,r.height);poseCamera();}
new ResizeObserver(resize).observe($('stage'));

function syncUI() {
  for(const [key,value] of Object.entries(cfg)) {
    const el=$(key);if(!el)continue;
    if(el.type==='checkbox')el.checked=value;else el.value=String(value);
    if($(key+'-out'))$(key+'-out').textContent=key.startsWith('dead')?Math.round(value*100)+'%':Number(value).toFixed(['yaw','fov'].includes(key)?0:2);
  }
  $('size').disabled=cfg.projection!=='ortho';$('distance').disabled=cfg.projection!=='perspective';$('fov').disabled=cfg.projection!=='perspective';
  $('deadzone').style.width=(cfg.deadX*100)+'%';$('deadzone').style.height=(cfg.deadY*100)+'%';
  $('deadzone').style.display=cfg.guides&&cfg.behavior==='follow'?'block':'none';
  $('camera-caption').textContent=`${cfg.projection==='ortho'?'正交':'透视'} · ${{fixed:'固定中心',follow:'跟随角色',free:'自由观察'}[cfg.behavior]} · ${cfg.pitch.toFixed(1)}°`;
  document.querySelector('.yard-title').style.display=cfg.projection==='ortho' && cfg.size>=10?'block':'none';
  boundary.geometry.dispose();boundary.geometry=new THREE.BufferGeometry().setFromPoints([[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>new THREE.Vector3(x*cfg.boundX,.06,z*cfg.boundZ)));
  poseCamera();
}
for(const key of Object.keys(cfg))$(key)?.addEventListener('input',e=>{
  cfg[key]=e.target.type==='checkbox'?e.target.checked:typeof cfg[key]==='number'?Number(e.target.value):e.target.value;
  document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'));syncUI();
});
const presets={
 overview:{projection:'ortho',behavior:'fixed',yaw:45,pitch:35.264,size:12.5,confiner:false,guides:false},
 follow:{projection:'ortho',behavior:'follow',yaw:45,pitch:40,size:5.5,deadX:.16,deadY:.16,confiner:true,confineMode:'target',guides:true},
 top:{projection:'ortho',behavior:'fixed',yaw:0,pitch:89,size:11,confiner:false,guides:false},
 perspective:{projection:'perspective',behavior:'follow',yaw:35,pitch:30,distance:12,fov:48,confiner:true,confineMode:'target',guides:false},
};
function preset(name){Object.assign(cfg,presets[name]);target.set(0,0,0);if(cfg.behavior==='follow')target.set(world.player.x,0,world.player.z);document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));syncUI();}
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>preset(b.dataset.preset));
function reset(){world=makeWorld(collision);keys.clear();demo=false;$('demo').textContent='演示推行';if(cfg.behavior==='follow')target.set(world.player.x,0,world.player.z);updateObjects();}
$('demo').onclick=()=>{if(demo){demo=false;$('demo').textContent='演示推行';return;}reset();cfg.motion='auto';preset('follow');demo=true;$('demo').textContent='停止演示';};
$('reset').onclick=reset;$('center').onclick=()=>{target.set(world.player.x,0,world.player.z);poseCamera();};
function download(blob,name){const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('save').onclick=()=>download(new Blob([JSON.stringify({version:1,settings:cfg,target:target.toArray()},null,2)],{type:'application/json'}),'oshi-camera-settings.json');
$('screenshot').onclick=()=>{renderer.render(scene,camera);renderer.domElement.toBlob(b=>{if(b)download(b,'oshi-wasteland.png');});};
$('toggle-panel').onclick=()=>{document.body.classList.toggle('panel-hidden');$('toggle-panel').setAttribute('aria-expanded',String(!document.body.classList.contains('panel-hidden')));};
if(innerWidth<620)document.body.classList.add('panel-hidden');

function formFocused(){return /INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName);}
addEventListener('keydown',e=>{if(formFocused())return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyR')reset();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now();});
$('panel').addEventListener('focusin',()=>keys.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys.add(b.dataset.key);b.setPointerCapture(e.pointerId);};for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));});
let drag=null;
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{ $('stage').focus();if(e.button===2||e.button===1){drag={x:e.clientX,y:e.clientY,button:e.button};renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault();}});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  if(drag.button===2){cfg.yaw=((cfg.yaw-dx*.3+540)%360)-180;cfg.pitch=THREE.MathUtils.clamp(cfg.pitch+dy*.2,20,89);}
  else if(cfg.behavior==='free'){
    const yaw=THREE.MathUtils.degToRad(cfg.yaw),scale=(cfg.projection==='ortho'?cfg.size:cfg.distance*.4)/$('stage').clientHeight*2;
    target.x-=dx*Math.cos(yaw)*scale;target.z+=dx*Math.sin(yaw)*scale;
    target.x-=dy*Math.sin(yaw)*scale;target.z-=dy*Math.cos(yaw)*scale;
  }
  syncUI();
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,()=>drag=null);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();const key=cfg.projection==='ortho'?'size':'distance';cfg[key]=THREE.MathUtils.clamp(cfg[key]*Math.exp(e.deltaY*.001),key==='size'?3:6,key==='size'?19:45);syncUI();},{passive:false});

function optimizeStatic(root) {
  root.updateMatrixWorld(true);const buckets=new Map();
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
    // Imported primitives use the same attribute set, merged by material to reduce draw calls.
    const key=o.material.uuid;let b=buckets.get(key);if(!b){b={material:o.material,geometries:[]};buckets.set(key,b);}b.geometries.push(g);
  });
  const result=new THREE.Group();
  for(const b of buckets.values()) {const geometry=mergeGeometries(b.geometries);if(!geometry)throw Error('Environment geometry could not be merged');const mesh=new THREE.Mesh(geometry,b.material);mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);b.geometries.forEach(g=>g.dispose());}
  return result;
}
function updateObjects(){actorRoot.position.set(world.player.x,0,world.player.z);marker.position.set(world.player.x,.035,world.player.z);crateMeshes.forEach((o,i)=>o.position.set(world.crates[i].x,0,world.crates[i].z));}
function animateActor(next,dt){
  if(!mixer)return;
  if(state!==next||!currentAction){const action=actions[next];if(action){action.reset().fadeIn(.18).play();currentAction?.fadeOut(.18);currentAction=action;state=next;}}
  mixer.update(dt);
}
async function load(){
  try {
    const loader=new GLTFLoader();
    const [env,character,crate]=await Promise.all([
      loader.loadAsync(new URL('./assets/environment.glb',import.meta.url).href),
      loader.loadAsync(new URL('./assets/actor.glb',import.meta.url).href),
      loader.loadAsync(new URL('./assets/crate.glb',import.meta.url).href),
    ]);
    scene.add(optimizeStatic(env.scene));actor=character.scene;actorRoot.add(actor);
    actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    mixer=new THREE.AnimationMixer(actor);
    for(const clip of character.animations){actions[clip.name]=mixer.clipAction(clip);}
    for(const name of ['Idle','Walk','Push'])if(!actions[name])throw Error('Missing animation: '+name+'; found '+Object.keys(actions));
    for(let i=0;i<world.crates.length;i++){const c=crate.scene.clone(true);c.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(c);crateMeshes.push(c);}
    updateObjects();ready=true;$('loading').classList.add('hidden');$('stage').focus();
  }catch(error){$('loading').textContent='模型加载失败：'+error.message;console.error(error);}
}
function tick(now){
  requestAnimationFrame(tick);const realDt=(now-last)/1000;const dt=Math.min(realDt,.05);last=now;elapsed+=dt;
  let next='Idle';
  if(ready){
    if(cfg.motion==='auto') {
      if(demo && (keys.size || world.player.z < -3)){demo=false;$('demo').textContent='演示推行';}
      const forward=demo?1:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const side=demo?0:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const yaw=!demo&&cfg.cameraRelative?THREE.MathUtils.degToRad(cfg.yaw):0;
      const v=new THREE.Vector3(side*Math.cos(yaw)-forward*Math.sin(yaw),0,-side*Math.sin(yaw)-forward*Math.cos(yaw));
      if(v.lengthSq()>0){v.normalize();const moved=stepWorld(world,v.x*cfg.speed*dt,v.z*cfg.speed*dt);next=moved.distance>.00001?(moved.pushed?'Push':'Walk'):'Idle';
        const angle=Math.atan2(-v.x,-v.z);const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle);actorRoot.quaternion.slerp(rotation,1-Math.exp(-16*dt));
      }
    }else next=cfg.motion;
    animateActor(next,dt);updateObjects();
  }
  updateCamera(dt);renderer.render(scene,camera);
  frames++;fpsTime+=realDt;if(fpsTime>.35){$('fps').textContent=Math.round(frames/fpsTime)+' FPS';frames=0;fpsTime=0;$('actor-state').textContent=({Idle:'待机',Walk:'行走',Push:'推动'})[state]+(cfg.motion!=='auto'?' · 预览':'');$('position').textContent=`${world.player.x.toFixed(2)}, ${world.player.z.toFixed(2)}`;$('demo-status').textContent=`箱 1：${world.crates[0].x.toFixed(2)}, ${world.crates[0].z.toFixed(2)} · ${demo?'演示中，方向键可接管':'可随时复位再试'}`;}
}
// Read-only diagnostics for smoke verification, no connection to production game state.
window.wastelandLab={snapshot:()=>({ready,actorState:state,player:{...world.player},crates:world.crates.map(c=>({...c})),camera:{...cfg,target:target.toArray()},animations:Object.keys(actions),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,elapsed})};
syncUI();resize();load();requestAnimationFrame(tick);
