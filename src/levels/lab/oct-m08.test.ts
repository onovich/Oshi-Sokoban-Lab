import{expect,it}from'vitest';import{createGame,move}from'../../engine/game-engine';import{solveLevel}from'../../solver/level-solver';import{octM08}from'./oct-m08';
const dirs=['up','right','down','left']as const;type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM08.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('prepares the numbered middle Goal but keeps it available as a pushing side before final filling',()=>{expect(replay('RURLDLUDLULRRRRDULLURDLLLUR').status).toBe('won');});
function search(initial:State,ban:(s:State)=>boolean=()=>false){const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)]),q=[initial],seen=new Set([key(initial)]);for(let i=0;i<q.length;i++){if(q.length>70000)throw new Error('Unknown: budget exhausted');const s=q[i]!;if(s.status==='won')return{solved:true,states:q.length};for(const d of dirs){const r=move(s,d);if(!r.didMove||ban(r.state))continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return{solved:false,states:q.length};}
it('needs the shared upper Goal slot and its access before filling it',()=>{
 expect(search(createGame(octM08.board),s=>s.goals.some(g=>g.position.x===2&&g.position.y===0))).toEqual({solved:false,states:11708});
 expect(search(createGame(octM08.board),s=>s.player.x===2&&s.player.y===0&&s.goals.some(g=>g.position.x===2&&g.position.y===0)).solved).toBe(false);
 for(const condition of octM08.theorem.proofConditions)expect(solveLevel(octM08,{maximumStates:70000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
});
it('an extra right-side space decouples the need for the central Goal staging slot',()=>{
 const b={...octM08.board,width:6};expect(replay('UURLDDRUDLLULRRRRRDULLURDLLLLURR',createGame(b)).status).toBe('won');
 expect(search(createGame(b),s=>s.goals.some(g=>g.position.x===2&&g.position.y===0)).solved).toBe(true);
});
it('filling the center before moving the right Block consumes its only pushing side',()=>{
 const s=replay('RURLDLUDLULRRRRDULLLLUR');expect(s.blocks[0]!.position).toEqual({x:2,y:0});expect(search(s).solved).toBe(false);
});
it('every empty non-player floor cell has a transport or approach role',()=>{
 for(const[x,y]of[[0,0],[2,0],[4,0],[0,1],[2,1],[4,1],[1,2],[3,2],[4,2]])expect(search(createGame({...octM08.board,walls:[...octM08.board.walls,{x:x!,y:y!}]})).solved).toBe(false);
});
