import { expect,it } from 'vitest';
import { createGame,move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { octM03 } from './oct-m03';
const dirs=['up','right','down','left'] as const;
type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM03.board)){for(const letter of path){const r=move(state,dirs['URDL'.indexOf(letter)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('uses a wrong-number Goal as temporary transport space, then makes both correct assignments',()=>{
  expect(replay('UURRDRDLUULLDRURD').status).toBe('won');
});
function search(initial:State,ban:(s:State)=>boolean=()=>false){
  const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position)]),q=[initial],seen=new Set([key(initial)]);
  for(let i=0;i<q.length;i++){
    if(q.length>40000)throw new Error('Unknown: search budget exhausted');
    const state=q[i]!;if(state.status==='won')return {solved:true,states:q.length};
    for(const direction of dirs){const result=move(state,direction);if(!result.didMove||ban(result.state))continue;const k=key(result.state);if(seen.has(k))continue;seen.add(k);q.push({...result.state,history:[]});}
  }return {solved:false,states:q.length};
}
it('cannot solve without temporarily occupying a mismatched Goal',()=>{
  const result=search(createGame(octM03.board),s=>s.blocks.some(b=>s.goals.some(g=>g.number!==b.number&&g.position.x===b.position.x&&g.position.y===b.position.y)));
  expect(result).toEqual({solved:false,states:250});
});
it('requires the nonfinal B transport event under the official solver',()=>{
  expect(solveLevel(octM03,{maximumStates:40000,maximumPlans:1,forbiddenConditions:octM03.theorem.proofConditions}).status).toBe('proven-unsolved');
});
it('removing identity constraints permits direct independent delivery',()=>{
  const board={...octM03.board,terrainGoals:octM03.board.goals.map(g=>g.position),goals:[]};
  expect(replay('UURDURD',createGame(board)).status).toBe('won');
});
it('completing A first closes the later access needed by B',()=>{
  const state=replay('UURDLDR');
  expect(state.blocks[0]!.position).toEqual({x:2,y:2});
  expect(search(state).solved).toBe(false);
});
it('every initially empty non-player floor has a transport or pushing-side role',()=>{
  for(const [x,y] of [[0,0],[1,0],[2,0],[0,1],[3,1],[3,2]]){
    expect(search(createGame({...octM03.board,walls:[...octM03.board.walls,{x:x!,y:y!}]})).solved).toBe(false);
  }
});
