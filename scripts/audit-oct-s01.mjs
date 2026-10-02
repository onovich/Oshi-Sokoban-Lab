import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const require=createRequire(resolve(process.cwd(),'package.json'));
const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);
const root=dirname(fileURLToPath(import.meta.url));
const source=existsSync(resolve(process.cwd(),'src/levels/lab/oct-s01.ts'))?resolve(process.cwd(),'src/levels/lab/oct-s01.ts'):resolve(root,'oct-s01.ts');
const server=await createServer({root:process.cwd(),server:{middlewareMode:true},appType:'custom'});
try {
const {octS01:spec}=await server.ssrLoadModule(`/@fs/${source.replaceAll('\\','/')}`);
const {solveLevel}=await server.ssrLoadModule('/src/solver/level-solver.ts');
const {createGame,move}=await server.ssrLoadModule('/src/engine/game-engine.ts');
const {auditLevelMutations}=await server.ssrLoadModule('/src/levels/level-mutation-audit.ts');
const options={maximumStates:30000,maximumPlans:1,pushSlack:0,moveSlack:0};
const noReset=[{kind:'event',event:{key:'event:object-reset'}},{kind:'event',event:{key:'event:death-reset'}}];
// Independent lexicographic Dijkstra: minimize pushes first, inputs second.
// Transitions still use the real move(), with no deadlock pruning.
function minimumPushes(forbidReset){
 const key=s=>[s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)].map(p=>`${p.x},${p.y}`).join('|');
 const frontier=[{s:createGame(spec.board),pushes:0,inputs:0}],best=new Map([[key(frontier[0].s),[0,0]]]);let explored=0;
 while(frontier.length){frontier.sort((a,b)=>b.pushes-a.pushes||b.inputs-a.inputs);const n=frontier.pop();const known=best.get(key(n.s));if(n.pushes!==known[0]||n.inputs!==known[1])continue;
 if(++explored>30000)return {status:'budget-exhausted',explored};
 if(n.s.status==='won')return {status:'solved',pushes:n.pushes,inputs:n.inputs,explored};
 for(const d of ['up','right','down','left']){const m=move(n.s,d);if(!m.didMove||(forbidReset&&m.events.some(e=>e.type==='object-reset'||e.type==='death-reset')))continue;
 const pushes=n.pushes+m.events.filter(e=>e.type==='block-pushed'||e.type==='goal-pushed'||e.type==='gate-pushed').length,inputs=n.inputs+1,k=key(m.state),old=best.get(k);
 if(old&&(old[0]<pushes||(old[0]===pushes&&old[1]<=inputs)))continue;best.set(k,[pushes,inputs]);frontier.push({s:{...m.state,history:[]},pushes,inputs});}
 }return {status:'proven-unsolved',explored};
}
const minimum=minimumPushes(false),safeMinimum=minimumPushes(true);assert.equal(minimum.status,'solved');assert.equal(safeMinimum.status,'solved');assert.deepEqual([minimum.pushes,minimum.inputs],[safeMinimum.pushes,safeMinimum.inputs]);
console.log(JSON.stringify({name:'push-first-minimum',normal:minimum,forbidReset:safeMinimum}));
const cases={normal:solveLevel(spec,options),noReset:solveLevel(spec,{...options,forbiddenConditions:noReset}),noCore:solveLevel(spec,{...options,forbiddenConditions:spec.theorem.proofConditions}),contrast:solveLevel({...spec,board:{...spec.board,terrainSpikes:[]}},{...options,forbiddenConditions:spec.theorem.proofConditions})};
for(const [name,r] of Object.entries(cases))console.log(JSON.stringify({name,status:r.status,route:r.bestPlan?.directions,moves:r.bestPlan?.moves,pushes:r.bestPlan?.pushes,diagnostics:r.diagnostics}));
assert.equal(cases.normal.status,'solved');assert.equal(cases.noReset.status,'solved');
assert.equal(cases.noCore.status,'proven-unsolved');assert.equal(cases.contrast.status,'solved');
assert.equal(cases.normal.bestPlan.moves,cases.noReset.bestPlan.moves);assert.equal(cases.normal.bestPlan.pushes,cases.noReset.bestPlan.pushes);
const dry=solveLevel({...spec,board:{...spec.board,terrainSpikes:[]}},options);
assert.ok(dry.bestPlan.moves<cases.normal.bestPlan.moves);
console.log(JSON.stringify({name:'remove-spike-unrestricted',moves:dry.bestPlan.moves,pushes:dry.bestPlan.pushes,route:dry.bestPlan.directions}));
for(const [name,r] of [['normal',cases.normal],['contrast',cases.contrast]]){
let s=createGame(name==='normal'?spec.board:{...spec.board,terrainSpikes:[]});for(const d of r.bestPlan.directions){const m=move(s,d);assert.ok(m.didMove);s=m.state;}assert.equal(s.status,'won');}
// The natural down-first plan loses displacement through the remote right arm.
let s=createGame(spec.board);const prefix=['down','right','down','up','left','left','down','down','right','down','down','right','right','up','left','left','up'];
let reset;for(const d of prefix){const m=move(s,d);assert.ok(m.didMove);s=m.state;reset=m.events.find(e=>e.type==='object-reset')??reset;}
assert.ok(reset);assert.deepEqual(reset.contactCells,[{x:2,y:2}]);assert.deepEqual(s.blocks[0].position,{x:3,y:2});
console.log(JSON.stringify({lossPrefix:prefix,reset,player:s.player}));
console.log(JSON.stringify({mutations:auditLevelMutations(spec,30000)}));
console.log(JSON.stringify({sha256:createHash('sha256').update(readFileSync(source)).digest('hex'),limits:'No player acceptance; target D3; local machine checks only.'}));
} finally {await server.close();}
