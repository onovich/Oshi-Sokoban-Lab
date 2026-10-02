import{expect,it}from'vitest';import{createGame,move}from'../../engine/game-engine';import{solveLevel}from'../../solver/level-solver';import{octM06}from'./oct-m06';
const dirs=['up','right','down','left']as const;type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM06.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('leaves the aligned middle task unfinished until the far identity has passed its Goal',()=>{expect(replay('UURRRDRDLLRUULDULLDRRURD').status).toBe('won');});
function search(initial:State,ban:(s:State)=>boolean=()=>false){const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position)]),q=[initial],seen=new Set([key(initial)]);for(let i=0;i<q.length;i++){if(q.length>70000)throw new Error('Unknown: budget exhausted');const s=q[i]!;if(s.status==='won')return{solved:true,states:q.length};for(const d of dirs){const r=move(s,d);if(!r.didMove||ban(r.state))continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return{solved:false,states:q.length};}
it('needs the middle target as C transport space and delays B until C completes',()=>{
 expect(search(createGame(octM06.board),s=>s.blocks[2]!.position.x===2&&s.blocks[2]!.position.y===2)).toEqual({solved:false,states:7954});
 expect(search(createGame(octM06.board),s=>s.blocks[2]!.position.x===1&&s.blocks[2]!.position.y===2&&!(s.blocks[1]!.position.x===2&&s.blocks[1]!.position.y===2))).toEqual({solved:false,states:8436});
 expect(solveLevel(octM06,{maximumStates:70000,maximumPlans:1,forbiddenConditions:octM06.theorem.proofConditions}).status).toBe('proven-unsolved');
});
it('the tempting already-aligned middle delivery is an actual irreversible bad plan',()=>{const s=replay('UURRD');expect(s.blocks[1]!.position).toEqual({x:2,y:2});expect(search(s).solved).toBe(false);});
it('wildcard target identity decouples all three deliveries',()=>{expect(replay('UURDURDURD',createGame({...octM06.board,goals:[],terrainGoals:octM06.board.goals.map(g=>g.position)})).status).toBe('won');});
it('every empty non-player floor cell is needed for the crossed transport',()=>{for(const[x,y]of[[0,0],[1,0],[2,0],[3,0],[0,1],[4,1],[4,2]])expect(search(createGame({...octM06.board,walls:[...octM06.board.walls,{x:x!,y:y!}]})).solved).toBe(false);});
