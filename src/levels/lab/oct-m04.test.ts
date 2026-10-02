import{expect,it}from'vitest';
import{createGame,move}from'../../engine/game-engine';
import{solveLevel}from'../../solver/level-solver';
import{octM04}from'./oct-m04';
const dirs=['up','right','down','left']as const;
type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM04.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('moves one Fake through two useful stopping positions before delivering the true Block',()=>{expect(replay('RDLUDRULULDDLURDLUU').status).toBe('won');});
function search(initial:State,ban:(s:State)=>boolean=()=>false){
 const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position)]),q=[initial],seen=new Set([key(initial)]);
 for(let i=0;i<q.length;i++){if(q.length>40000)throw new Error('Unknown: search budget exhausted');const s=q[i]!;if(s.status==='won')return{solved:true,states:q.length};for(const d of dirs){const r=move(s,d);if(!r.didMove||ban(r.state))continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return{solved:false,states:q.length};
}
it('needs both the upper and lower Fake staging rows, not merely a single displacement',()=>{
 expect(search(createGame(octM04.board),s=>s.blocks[1]!.position.y===1)).toEqual({solved:false,states:5});
 expect(search(createGame(octM04.board),s=>s.blocks[1]!.position.y===3)).toEqual({solved:false,states:455});
 for(const condition of octM04.theorem.proofConditions)expect(solveLevel(octM04,{maximumStates:40000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
});
it('without Fake the Block cannot obtain its necessary lower pushing side',()=>{
 expect(search(createGame({...octM04.board,blocks:[octM04.board.blocks[0]!]}))).toEqual({solved:false,states:53});
});
it('a fixed lower stop or clear weather removes the need to stage Fake',()=>{
 const wallBoard={...octM04.board,walls:[...octM04.board.walls,{x:1,y:3}]};
 expect(replay('RDLUU',createGame(wallBoard)).status).toBe('won');
 expect(replay('RRRDDLUU',createGame({...octM04.board,weather:'clear'})).status).toBe('won');
});
it('using Fake once but abandoning it at the upper edge destroys its second role',()=>{
 expect(search(replay('RDLUU')).solved).toBe(false);
});
it('all other empty floor cells are necessary; sealing the return shortcut preserves a longer solution',()=>{
 for(const[x,y]of[[1,0],[1,1],[2,1],[3,1],[3,2],[2,3],[3,3]])expect(search(createGame({...octM04.board,walls:[...octM04.board.walls,{x:x!,y:y!}]})).solved).toBe(false);
 expect(replay('RDLUDRULULDDURDRDLUU',createGame({...octM04.board,walls:[...octM04.board.walls,{x:0,y:2}]})).status).toBe('won');
});
