import{expect,it}from'vitest';import{createGame,move}from'../../engine/game-engine';import{solveLevel}from'../../solver/level-solver';import{octM10}from'./oct-m10';
const dirs=['up','right','down','left']as const;type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM10.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('returns the upper staging resource to its own numbered destination before completing the companion',()=>{expect(replay('UDRULULDDLDRRUU').status).toBe('won');});
function search(initial:State,ban:(s:State,r:ReturnType<typeof move>)=>boolean=()=>false){const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position)]),q=[initial],seen=new Set([key(initial)]);for(let i=0;i<q.length;i++){if(q.length>70000)throw new Error('Unknown: budget exhausted');const s=q[i]!;if(s.status==='won')return{solved:true,states:q.length};for(const d of dirs){const r=move(s,d);if(!r.didMove||ban(s,r))continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return{solved:false,states:q.length};}
const banReturn=(_s:State,r:ReturnType<typeof move>)=>r.events.some(e=>e.type==='block-pushed'&&e.entityId==='lab-oct-m10-b'&&e.from.y===1&&e.to.y===2);
it('needs both the outward staging and return rather than a nearest-target exchange',()=>{
 expect(search(createGame(octM10.board),(_s,r)=>r.state.blocks[1]!.position.y===1)).toEqual({solved:false,states:5});
 expect(search(createGame(octM10.board),banReturn)).toEqual({solved:false,states:287});
 for(const condition of octM10.theorem.proofConditions)expect(solveLevel(octM10,{maximumStates:70000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
});
it('matching all identities removes return necessity without changing any physical entity type',()=>{
 const b={...octM10.board,blocks:octM10.board.blocks.map(x=>({...x,number:0})),goals:octM10.board.goals.map(x=>({...x,number:0}))};
 expect(replay('UDRULDLURDRUU',createGame(b)).status).toBe('won');expect(search(createGame(b),banReturn).solved).toBe(true);
});
it('throwing the borrowed task to the top edge prevents recovering it',()=>{expect(search(replay('UU')).solved).toBe(false);});
it('apparently removable void cells prevent fixed Rain stops that bypass staging',()=>{
 for(const[x,y]of[[0,1],[3,1]])expect(search(createGame({...octM10.board,walls:[...octM10.board.walls,{x:x!,y:y!}]}),(_s,r)=>r.state.blocks[1]!.position.y===1).solved).toBe(true);
 for(const[x,y]of[[0,2],[0,3],[1,0],[1,1],[2,1],[2,3],[3,2]])expect(search(createGame({...octM10.board,walls:[...octM10.board.walls,{x:x!,y:y!}]})).solved).toBe(false);
});
