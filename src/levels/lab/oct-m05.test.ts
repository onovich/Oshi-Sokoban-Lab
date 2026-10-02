import{expect,it}from'vitest';
import{createGame,move}from'../../engine/game-engine';
import{solveLevel}from'../../solver/level-solver';
import{octM05}from'./oct-m05';
const dirs=['up','right','down','left']as const;
type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM05.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('uses the lower task Block as an upper stop before releasing it for its own delivery',()=>{expect(replay('RRLDRDRURUDLURURDRDLULDD').status).toBe('won');});
function search(initial:State,ban:(s:State)=>boolean=()=>false){
 const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)]),q=[initial],seen=new Set([key(initial)]);
 for(let i=0;i<q.length;i++){if(q.length>40000)throw new Error('Unknown: search budget exhausted');const s=q[i]!;if(s.status==='won')return{solved:true,states:q.length};for(const d of dirs){const r=move(s,d);if(!r.didMove||ban(r.state))continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return{solved:false,states:q.length};
}
it('requires B to move away from the lower Goal and the movable Goal to reach the far column',()=>{
 expect(search(createGame(octM05.board),s=>s.blocks[1]!.position.y<2)).toEqual({solved:false,states:240});
 expect(search(createGame(octM05.board),s=>s.goals[0]!.position.x===3)).toEqual({solved:false,states:1807});
 for(const condition of octM05.theorem.proofConditions)expect(solveLevel(octM05,{maximumStates:40000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
});
it('clear weather removes the necessity of lifting B before doing the upper task',()=>{
 const b={...octM05.board,weather:'clear' as const};expect(replay('RRRDUDLULDUUR',createGame(b)).status).toBe('won');
 expect(search(createGame(b),s=>s.blocks[1]!.position.y<2).solved).toBe(true);
});
it('every initially empty non-player floor cell is needed',()=>{
 for(const[x,y]of[[1,0],[3,0],[2,1],[3,1],[0,2],[1,2],[3,2],[2,3]])expect(search(createGame({...octM05.board,walls:[...octM05.board.walls,{x:x!,y:y!}]})).solved).toBe(false);
});
it('pushing B down directly toward its lower Goal loses the side needed for its final horizontal move',()=>{
 // A quick lower-target plan: the first upward staging is skipped.
 const s=replay('RRD');expect(s.blocks[1]!.position).toEqual({x:2,y:3});expect(search(s).solved).toBe(false);
});
