// ---------- State ----------
const dom = id => document.getElementById(id);
const fields = ["text","size","face","bg","depth","stepPx","anim","rot","wobbleAmp","wobbleHzX","wobbleHzY","seeSawHz","mx","my"];
const defaults = {
  text:"GOBLIN TTS", size:72, face:"#dce8ff", bg:"#000000",
  depth:96, stepPx:1, anim:"wobble", rot:18,
  wobbleAmp:8, wobbleHzX:0.23, wobbleHzY:0.17, seeSawHz:0.45,
  mx:22, my:27
};
function readUI(){ return Object.fromEntries(fields.map(k=>{
  const el = dom(k);
  const v = (el.type==="number") ? Number(el.value) : el.value;
  return [k, v];
})); }
function writeUI(cfg){ fields.forEach(k=>{ if(dom(k)) dom(k).value = cfg[k]; }); }
function fromURL(){
  const qp = new URLSearchParams(location.search);
  let cfg = {...defaults};
  fields.forEach(k=>{
    if(qp.has(k)){
      const val = qp.get(k);
      cfg[k] = (dom(k)?.type==="number") ? Number(val) : val;
    }
  });
  return cfg;
}
function loadSaved(){
  try{ const s = localStorage.getItem("text3d-cfg"); return s ? {...defaults, ...JSON.parse(s)} : defaults; }
  catch{ return defaults; }
}
function save(cfg){ localStorage.setItem("text3d-cfg", JSON.stringify(cfg)); }

// ---------- Three.js setup ----------
const canvas = dom("c");
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:"high-performance"});
renderer.setPixelRatio(1);
resize();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth/canvas.clientHeight, 0.1, 5000);
camera.position.set(0,0,200);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(1,1,2);
scene.add(keyLight);
scene.add(new THREE.AmbientLight(0x404040));

const fontLoader = new THREE.FontLoader();
let fontCache = null;
let mesh = null;

function makeText(cfg){
  if(mesh){ scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); mesh=null; }
  const geo = new THREE.TextGeometry(cfg.text, {
    font: fontCache, size: cfg.size, height: Math.max(2, Math.round(cfg.size*0.3)),
    curveSegments: 12, bevelEnabled: true, bevelThickness: cfg.size*0.05, bevelSize: cfg.size*0.025, bevelSegments: 4
  });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({color: new THREE.Color(cfg.face), metalness:0.3, roughness:0.4});
  mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  scene.background = new THREE.Color(cfg.bg);
}

// bounded float
function startBouncer(carrier, measure, secX, secY, margin=16){
  let x=margin,y=margin,dx=1,dy=1,raf=0,last=performance.now();
  function frame(now){
    const dt=(now-last)/1000; last=now;
    const b = {w:canvas.clientWidth, h:canvas.clientHeight};
    const box = new THREE.Box3().setFromObject(measure);
    const size = new THREE.Vector3(); box.getSize(size);
    const maxX=Math.max(margin, b.w - size.x - margin);
    const maxY=Math.max(margin, b.h - size.y - margin);
    const vx=(maxX-margin)/Math.max(0.001,secX);
    const vy=(maxY-margin)/Math.max(0.001,secY);
    x+=dx*vx*dt; y+=dy*vy*dt;
    if(x<=margin){x=margin;dx=1} if(x>=maxX){x=maxX;dx=-1}
    if(y<=margin){y=margin;dy=1} if(y>=maxY){y=maxY;dy=-1}
    carrier.position.set(x - b.w/2, -(y - b.h/2), 0);
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return ()=>cancelAnimationFrame(raf);
}

// rotation modes
function startSpinMode(target, {mode, rotSec, wobAmpDeg, wobHzX, wobHzY, seeSawHz}){
  let raf=0, t0=performance.now();
  if(mode==='random'){ mode = ['none','see-saw','wobble'][Math.floor(Math.random()*3)]; }
  if(mode==='none'){ target.rotation.set(0,0,0); return ()=>{}; }
  const baseX=360/rotSec, baseY=720/rotSec, A=wobAmpDeg*(Math.PI/180);
  function frame(now){
    const t=(now-t0)/1000;
    if(mode==='wobble'){
      target.rotation.x = (baseX*t + A*Math.sin(2*Math.PI*wobHzX*t)) * (Math.PI/180);
      target.rotation.y = (baseY*t + A*Math.sin(2*Math.PI*wobHzY*t + Math.PI/3)) * (Math.PI/180);
    } else { // see-saw
      target.rotation.x =  A*Math.sin(2*Math.PI*seeSawHz*t);
      target.rotation.y = -A*Math.sin(2*Math.PI*seeSawHz*t);
    }
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return ()=>cancelAnimationFrame(raf);
}

let stopMove = ()=>{}, stopSpin = ()=>{};

function apply(cfg){
  // camera framing
  camera.position.set(0,0,Math.max(150, cfg.size*3));
  // text
  makeText(cfg);
  // motion
  stopMove(); stopSpin();
  const carrier = new THREE.Group();
  scene.add(carrier);
  carrier.add(mesh);
  stopMove = startBouncer(carrier, mesh, cfg.mx, cfg.my, 16);
  stopSpin = startSpinMode(mesh, {mode:cfg.anim, rotSec:cfg.rot, wobAmpDeg:cfg.wobbleAmp, wobHzX:cfg.wobbleHzX, wobHzY:cfg.wobbleHzY, seeSawHz:cfg.seeSawHz});
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

function resize(){
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w,h,false);
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// ---------- UI wiring ----------
function setUI(cfg){ writeUI(cfg); apply(cfg); }
function currentCfg(){ return readUI(); }

// load order: URL > saved > defaults
const cfg0 = {...defaults, ...loadSaved(), ...fromURL()};
setUI(cfg0);

// live save/apply
fields.forEach(k=>{
  dom(k).addEventListener('input', ()=>{
    const cfg = currentCfg();
    save(cfg);
    apply(cfg);
  });
});
dom("save").onclick = ()=> save(currentCfg());
dom("reset").onclick = ()=>{ localStorage.removeItem("text3d-cfg"); const c={...defaults}; writeUI(c); apply(c); };
dom("share").onclick = ()=>{
  const cfg = currentCfg();
  const qp = new URLSearchParams();
  fields.forEach(k=> qp.set(k, cfg[k]));
  navigator.clipboard.writeText(location.origin + location.pathname + "?" + qp.toString());
};

// ---------- Font load (local hosting works on GitHub Pages) ----------
fontLoader.load(
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/fonts/helvetiker_bold.typeface.json',
  f => { fontCache = f; apply(currentCfg()); }
);
