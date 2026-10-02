import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const name=process.argv[2]??'oct-s02',exportName=name.replace('oct-s','octS');
const originMode=Number(name.slice(-2))>=5;
const originOpen={'oct-s05':[{x:3,y:1}]};
const require=createRequire(resolve(process.cwd(),'package.json'));
const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);
const dir=dirname(fileURLToPath(import.meta.url));
const source=existsSync(resolve(process.cwd(),`src/levels/lab/${name}.ts`))?resolve(process.cwd(),`src/levels/lab/${name}.ts`):resolve(dir,`${name}.ts`);
const server=await createServer({root:process.cwd(),server:{middlewareMode:true},appType:'custom'});
try {
 const module=await server.ssrLoadModule(`/@fs/${source.replaceAll('\\','/')}`),spec=module[exportName];
 const {createGame,move}=await server.ssrLoadModule('/src/engine/game-engine.ts');
 const {solveLevel}=await server.ssrLoadModule('/src/solver/level-solver.ts');
 const {auditLevelMutations}=await server.ssrLoadModule('/src/levels/level-mutation-audit.ts');
 const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
 const bans=[{kind:'event',event:{key:'event:object-reset'}},{kind:'event',event:{key:'event:death-reset'}}];
 function pushFirst(forbid){
  const key=s=>[s.player,...s.blocks.map(e=>e.position),...s.goals.map(e=>e.position),...s.gates.map(e=>e.position)].map(p=>`${p.x},${p.y}`).join('|');
  const frontier=[{s:createGame(spec.board),p:0,m:0}],best=new Map([[key(frontier[0].s),[0,0]]]);let explored=0;
  while(frontier.length){frontier.sort((a,b)=>b.p-a.p||b.m-a.m);const n=frontier.pop(),k=key(n.s),known=best.get(k);if(n.p!==known[0]||n.m!==known[1])continue;
   if(++explored>80000)return {status:'budget-exhausted',explored};if(n.s.status==='won')return {status:'solved',pushes:n.p,moves:n.m,explored};
   for(const d of ['up','right','down','left']){const r=move(n.s,d);if(!r.didMove||(forbid&&r.events.some(e=>e.type==='object-reset'||e.type==='death-reset')))continue;
    const p=n.p+r.events.filter(e=>['block-pushed','goal-pushed','gate-pushed'].includes(e.type)).length,m=n.m+1,t=key(r.state),old=best.get(t);
    if(old&&(old[0]<p||(old[0]===p&&old[1]<=m)))continue;best.set(t,[p,m]);frontier.push({s:{...r.state,history:[]},p,m});}
  }return {status:'proven-unsolved',explored};
 }
 const normal=solveLevel(spec,options),safe=solveLevel(spec,{...options,forbiddenConditions:bans});
 if(name==='oct-s03'){let state=createGame(spec.board),death;for(const l of 'DRUUULUL'){const r=move(state,{U:'up',D:'down',L:'left',R:'right'}[l]);assert.ok(r.didMove);state=r.state;death=r.events.find(e=>e.type==='death-reset')??death;}assert.ok(death);assert.deepEqual(state.blocks[1].position,{x:4,y:2});assert.deepEqual(state.player,{x:1,y:0});console.log(JSON.stringify({loss:'DRUUULUL',result:'all preparation reset'}));}
 if(name==='oct-s04'){let state=createGame(spec.board),death;for(const l of 'DLDDDLLUULUDD'){const r=move(state,{U:'up',D:'down',L:'left',R:'right'}[l]);assert.ok(r.didMove);state=r.state;death=r.events.find(e=>e.type==='death-reset')??death;}assert.ok(death);assert.deepEqual(state.blocks[0].position,{x:1,y:3});assert.deepEqual(state.gates[1].position,{x:0,y:1});console.log(JSON.stringify({loss:'DLDDDLLUULUDD',result:'Block and Gate preparation reset'}));}
 if(name==='oct-s05'){let state=createGame(spec.board);for(const l of 'LLDLDRRDDLUURDR'){const r=move(state,{U:'up',D:'down',L:'left',R:'right'}[l]);assert.ok(r.didMove);state=r.state;}assert.deepEqual(state.blocks.map(b=>b.position),[{x:2,y:1},{x:4,y:2}]);const rejected=move(state,'up');assert.equal(rejected.didMove,false);assert.match(rejected.event,/Reset conflict/);assert.deepEqual(rejected.state,state);console.log(JSON.stringify({boundary:'occupied-origin blocks B reset',result:'passed'}));}
 const forbidden=solveLevel(spec,{...options,forbiddenConditions:spec.theorem.proofConditions});
 const drySpec=originMode?{...spec,board:{...spec.board,walls:spec.board.walls.filter(p=>!originOpen[name].some(o=>p.x===o.x&&p.y===o.y))}}:{...spec,board:{...spec.board,terrainSpikes:[]}};
 const contrast=solveLevel(drySpec,{...options,forbiddenConditions:spec.theorem.proofConditions});
 for(const [label,r] of Object.entries({normal,safe,forbidden,contrast}))console.log(JSON.stringify({label,status:r.status,moves:r.bestPlan?.moves,pushes:r.bestPlan?.pushes,route:r.bestPlan?.directions.map(d=>d[0].toUpperCase()).join(''),states:r.diagnostics.exploredStates,complete:r.diagnostics.completePlanWindow}));
 assert.equal(normal.status,'solved');assert.equal(safe.status,originMode?'proven-unsolved':'solved');assert.equal(forbidden.status,'proven-unsolved');assert.equal(contrast.status,'solved');
 if(!originMode)assert.deepEqual([normal.bestPlan.moves,normal.bestPlan.pushes],[safe.bestPlan.moves,safe.bestPlan.pushes]);assert.ok(contrast.bestPlan.moves<normal.bestPlan.moves);
 if(originMode)for(const condition of spec.theorem.proofConditions){const r=solveLevel(spec,{...options,forbiddenConditions:[condition]});console.log(JSON.stringify({condition,status:r.status,states:r.diagnostics.exploredStates}));assert.equal(r.status,'proven-unsolved');}
 for(const [board,report] of [[spec.board,normal],[drySpec.board,contrast]]){let s=createGame(board);for(const d of report.bestPlan.directions){const r=move(s,d);assert.ok(r.didMove);s=r.state;}assert.equal(s.status,'won');}
 const pushNormal=pushFirst(false),pushSafe=pushFirst(true);console.log(JSON.stringify({pushNormal,pushSafe}));assert.equal(pushNormal.status,'solved');assert.equal(pushSafe.status,originMode?'proven-unsolved':'solved');if(!originMode)assert.deepEqual([pushNormal.pushes,pushNormal.moves],[pushSafe.pushes,pushSafe.moves]);
 if(originMode){let state=createGame(spec.board);for(const d of normal.bestPlan.directions){const r=move(state,d);state=r.state;if(r.events.length)console.log(JSON.stringify({direction:d,events:r.events,blocks:state.blocks.map(b=>({id:b.id,position:b.position}))}));}}
 console.log(JSON.stringify({mutations:auditLevelMutations(spec,80000)}));
 console.log(JSON.stringify({sha256:createHash('sha256').update(readFileSync(source)).digest('hex')}));
}finally{await server.close();}
