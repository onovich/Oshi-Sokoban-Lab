import{expect,it}from'vitest';import{createGame,move}from'../../engine/game-engine';import{solveLevel}from'../../solver/level-solver';import{octM09}from'./oct-m09';
const dirs=['up','right','down','left']as const;type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM09.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('withdraws the shared Goal from a temporarily completed Block and later recovers its coverage',()=>{expect(replay('DRURRLRUULDRDLRDL').status).toBe('won');});
function search(initial:State,ban:(s:State,r:ReturnType<typeof move>)=>boolean=()=>false){const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)]),q=[initial],seen=new Set([key(initial)]);for(let i=0;i<q.length;i++){if(q.length>70000)throw new Error('Unknown: budget exhausted');const s=q[i]!;if(s.status==='won')return{solved:true,states:q.length};for(const d of dirs){const r=move(s,d);if(!r.didMove||ban(s,r))continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return{solved:false,states:q.length};}
it('requires B temporary coverage and subsequent withdrawal of its Goal',()=>{
 expect(search(createGame(octM09.board),(_s,r)=>r.state.blocks[1]!.position.x===2&&r.state.blocks[1]!.position.y===3)).toEqual({solved:false,states:1434});
 expect(search(createGame(octM09.board),(s,r)=>s.blocks[1]!.position.x===2&&s.blocks[1]!.position.y===3&&s.goals[0]!.position.x===2&&r.state.goals[0]!.position.x===1).solved).toBe(false);
 for(const condition of octM09.theorem.proofConditions)expect(solveLevel(octM09,{maximumStates:70000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
});
it('the right Fake must be cleared only because B is a real task',()=>{
 const ban=(_s:State,r:ReturnType<typeof move>)=>r.events.some(e=>e.type==='block-pushed'&&e.entityId==='lab-oct-m09-f');
 expect(search(createGame(octM09.board),ban)).toEqual({solved:false,states:687});
 const b={...octM09.board,blocks:octM09.board.blocks.map(x=>x.id==='lab-oct-m09-b'?{...x,isFake:true}:x)};
 expect(replay('DRURRLRUULDRDL',createGame(b)).status).toBe('won');expect(search(createGame(b),ban).solved).toBe(true);
});
it('retains the plausible but losing direct-right Block approach and needs the other empty cells',()=>{
 expect(search(replay('UR')).solved).toBe(false);
 expect(replay('DRURRLRUULDRDLRDL',createGame({...octM09.board,walls:[...octM09.board.walls,{x:0,y:1}]})).status).toBe('won');
 for(const[x,y]of[[0,3],[1,2],[2,0],[3,0],[3,1],[3,2],[3,4]])expect(search(createGame({...octM09.board,walls:[...octM09.board.walls,{x:x!,y:y!}]})).solved).toBe(false);
});
