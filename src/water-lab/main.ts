import { createExperiment } from './gpu';
import './style.css';

const root=document.querySelector<HTMLElement>('#water-lab')!;
root.innerHTML=`<header><span>OSHI / RENDERING LAB · 非正式效果</span><h1>水会怎样被方块推开？</h1>
<p>A / C 两种模拟，同样的方块、路径、光照。采用侧视正面与隐藏底面，不会读取或修改游戏进度。</p></header>
<section class="controls" aria-label="实验控制">
<button id="auto">开始自动往返</button><button id="reset">重置水面</button>
<label><input id="rain" type="checkbox"> 雨滴（A/C）</label><label><input id="debug" type="checkbox"> 诊断色</label>
<label><input id="footprint" type="checkbox"> 显示接触区</label>
<label>速度 <input id="speed" type="range" min="0.1" max="0.7" step="0.05" value="0.3"></label>
<label>查看 <select id="view"><option value="all">A / C 对比</option><option value="0">A 大图</option><option value="1">C 大图</option></select></label>
<output id="status" aria-live="polite">准备中</output></section>
<p class="instruction">拖动白方块，两幅同步响应；也可聚焦画面按方向键。白块是正面，底边后方的接触纵深为正面高度的 1/2；灰色障碍同理。“显示接触区”中的绿色才是实际排水范围，半透明部分仅用于对照正面轮廓。</p>
<section class="panels"></section>
<footer><h2>看什么，而不是只看哪幅更亮</h2><p>A：波浪是否围绕底部传播、反射？ C：底部前面是否积水、后面是否回填？<br>诊断色：红色是正水位、蓝色是负水位。B 已退出本轮比较。</p>
<p>C 是<strong>线性化浅水原型</strong>，不是已验证的守恒求解器；移动占格的补水、夹值和边界仍是近似。两者都没有完整三维折射、喷溅或多物件耦合。当前是侧视风格的接触区近似，不是真正三维摄像机。</p>
<p>资料：<a href="https://madebyevan.com/webgl-water/">Evan Wallace</a> · <a href="https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu">GPU Gems 38</a> · <a href="https://matthias-research.github.io/pages/publications/hfFluid.pdf">Chentanez / Müller</a>。算法思路独立实现，未复制参考代码或贴图。</p></footer>`;
const descriptions=[
 ['A / 高度场波动','存储高度与竖直速度。更适合雨滴与波浪；不模拟水平水流。'],
 ['C / 线性化浅水','水位与水平速度相互作用。研究推水与回填；暂未实现严格体积守恒。'],
];
let position=[.65,.55],target=[...position],automatic=false,simTime=0,steps=0;
const panels=document.querySelector('.panels')!;
const experiments: ReturnType<typeof createExperiment>[]=[];
const diagnostics: HTMLElement[]=[];
for(const [index,[title,description]] of descriptions.entries()){
 const article=document.createElement('article');
 article.innerHTML=`<h2>${title}</h2><p>${description}</p><canvas width="512" height="384" tabindex="0" aria-label="${title}，可拖动或使用方向键"></canvas><small>128² 模拟网格 · 固定 120 Hz 子步</small>`;
 panels.append(article);const canvas=article.querySelector('canvas')!;
 try{experiments.push(createExperiment(canvas,index===0?0:2));diagnostics.push(article.querySelector('small')!);}catch(error){article.append(String(error));continue;}
 let dragging=false;
 function point(e:PointerEvent){const r=canvas.getBoundingClientRect();return [Math.max(.08,Math.min(.92,(e.clientX-r.left)/r.width)),Math.max(.08,Math.min(.92,1-(e.clientY-r.top)/r.height))];}
 canvas.onpointerdown=e=>{const p=point(e);if(Math.abs(p[0]!-position[0]!)>.1||Math.abs(p[1]!-position[1]!)>.1)return;dragging=true;automatic=false;updateButton();canvas.setPointerCapture(e.pointerId);target=p;};
 canvas.onpointermove=e=>{if(dragging)target=point(e);};
 canvas.onpointerup=canvas.onpointercancel=()=>{dragging=false;};
 canvas.onkeydown=e=>{const d:Record<string,number[]>={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};if(!d[e.key])return;e.preventDefault();automatic=false;updateButton();target=position.map((v,i)=>Math.max(.08,Math.min(.92,v+d[e.key]![i]!)));};
}
const button=document.querySelector<HTMLButtonElement>('#auto')!;
document.querySelector<HTMLSelectElement>('#view')!.onchange=e=>{
 const value=(e.target as HTMLSelectElement).value;
 panels.classList.toggle('panels--single',value!=='all');
 panels.querySelectorAll('article').forEach((article,index)=>{article.hidden=value!=='all'&&Number(value)!==index;});
};
function updateButton(){button.textContent=automatic?'停止自动往返':'开始自动往返';}
button.onclick=()=>{automatic=!automatic;updateButton();if(!automatic)target=[...position];};
document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{experiments.forEach(e=>e.reset());};
const rain=document.querySelector<HTMLInputElement>('#rain')!,debug=document.querySelector<HTMLInputElement>('#debug')!,speed=document.querySelector<HTMLInputElement>('#speed')!;
const footprint=document.querySelector<HTMLInputElement>('#footprint')!;
const status=document.querySelector<HTMLOutputElement>('#status')!;
let last=0,accumulator=0,frame=0,frames=0,lastReport=0;
function tick(time:number){
 frame=requestAnimationFrame(tick);
 if(document.hidden){last=time;return;}
 accumulator+=Math.min(.04,(time-(last||time))/1000);last=time;
 while(accumulator>=1/120){
  simTime+=1/120;steps++;
  if(automatic)target=[.58+Math.sin(simTime*.9)*.25,.55+Math.sin(simTime*.45)*.18];
  const before=[...position],delta=target.map((v,i)=>v-position[i]!),distance=Math.hypot(...delta);
  const amount=Math.min(distance,Number(speed.value)/120);
  let next=position.map((v,i)=>v+(distance?delta[i]!/distance*amount:0));
  // Same solid geometry as the solvers, with a small water gap before the static wall.
  if(Math.abs(next[0]!-.24)<.115&&Math.abs((next[1]!-.0325)-.395)<.1225)next=[...position];
  position=next;
  const drop=rain.checked&&steps%17===0?[(steps*.618)%1,(steps*.414)%1]:null;
  experiments.forEach(e=>e.step(position,before,drop));accumulator-=1/120;
 }
 experiments.forEach(e=>e.draw(debug.checked,footprint.checked));frames++;
 if(time-lastReport>1000){
  status.textContent=`${experiments.length}/2 已启动 · ${Math.round(frames*1000/(time-lastReport))} fps`;
  experiments.forEach((e,i)=>{diagnostics[i]!.textContent=`128² · ${e.diagnose()}`;});
  lastReport=time;frames=0;
 }
}
frame=requestAnimationFrame(tick);
addEventListener('pagehide',()=>{cancelAnimationFrame(frame);experiments.forEach(e=>e.dispose());},{once:true});
