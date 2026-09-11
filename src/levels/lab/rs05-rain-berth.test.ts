import {expect,it} from 'vitest';
import {createGame,isBlockSolved,move} from '../../engine/game-engine';
import {solveLevel} from '../../solver/level-solver';
import {rainBerth} from './rs05-rain-berth';

it('starts with no completed objects and requires building the temporary berth',()=>{
  const initial=createGame(rainBerth.board);
  expect(initial.blocks.every(b=>!isBlockSolved(initial,b))).toBe(true);
  const options={maximumStates:80000,maximumPlans:1};
  const report=solveLevel(rainBerth,options);
  expect(report.status).toBe('solved');
  let state=initial;
  for(const direction of report.bestPlan!.directions) state=move(state,direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(rainBerth,{...options,forbiddenConditions:rainBerth.theorem.proofConditions}).status).toBe('proven-unsolved');
});

function canSolve(weather:'rain'|'clear', forbid:boolean){
 const q=[createGame({...rainBerth.board,weather})];
 const key=(s:typeof q[number])=>JSON.stringify([s.player,s.blocks.map(b=>b.position)]);
 const seen=new Set([key(q[0]!)]);
 for(let i=0;i<q.length;i++){
  const s=q[i]!;if(s.status==='won')return true;
  for(const d of ['up','right','down','left'] as const){
   const n=move(s,d).state;
   if(forbid&&s.player.x===4&&s.player.y===2&&n.player.x===3&&n.player.y===2)continue;
   const k=key(n);if(seen.has(k))continue;seen.add(k);q.push({...n,history:[]});
  }
 }
 return false;
}
it('requires borrowing the stopping position before completion, specifically in rain',()=>{
 expect(canSolve('rain',false)).toBe(true);
 expect(canSolve('rain',true)).toBe(false);
 expect(canSolve('clear',true)).toBe(true);
});
