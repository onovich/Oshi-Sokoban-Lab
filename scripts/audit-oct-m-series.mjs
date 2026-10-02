// Run at repository root: node scripts/audit-oct-m-series.mjs
// Before production copy: pass a draft-directory argument. No personal path is embedded.
import{pathToFileURL}from'node:url';import{resolve}from'node:path';
const{createServer}=await import(pathToFileURL(resolve('node_modules/vite/dist/node/index.js')).href);
const server=await createServer({root:process.cwd(),server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const{createGame,move}=await server.ssrLoadModule('/src/engine/game-engine.ts');
 const{solveLevel}=await server.ssrLoadModule('/src/solver/level-solver.ts');
 const{frozenLevelHash}=await server.ssrLoadModule('/src/course/accepted-freeze.ts');
 for(let i=1;i<=10;i++){
  const suffix=String(i).padStart(2,'0'),name=`oct-m${suffix}`;
  const path=process.argv[2]?'/@fs/'+resolve(process.argv[2],name+'.ts').replaceAll('\\','/'):`/src/levels/lab/${name}.ts`;
  const spec=(await server.ssrLoadModule(path))[`octM${suffix}`];
  const result=solveLevel(spec,{maximumStates:70000,maximumPlans:1});
  if(result.status!=='solved')throw new Error(`${name}: ${result.status}, not certified`);
  let state=createGame(spec.board),pushes=0;
  for(const direction of result.bestPlan.directions){const r=move(state,direction);if(!r.didMove)throw new Error(`${name}: blocked replay`);state=r.state;pushes+=r.events.filter(e=>e.type==='block-pushed'||e.type==='goal-pushed').length;}
  if(state.status!=='won')throw new Error(`${name}: replay not won`);
  const forbidden=[];for(const condition of spec.theorem.proofConditions){const status=solveLevel(spec,{maximumStates:70000,maximumPlans:1,forbiddenConditions:[condition]}).status;if(status!=='proven-unsolved')throw new Error(`${name}: core condition ${status}`);forbidden.push({condition,status});}
  console.log(JSON.stringify({id:spec.id,hash:frozenLevelHash(spec),status:'solved',inputs:result.bestPlan.directions.length,pushes,route:result.bestPlan.directions.map(d=>d[0].toUpperCase()).join(''),forbidden}));
 }
}finally{await server.close()}
