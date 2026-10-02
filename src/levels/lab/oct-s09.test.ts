import { describe, expect, it } from 'vitest';
import { octS09 } from './oct-s09';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
describe('octS09 rain Fake reset side transfer',()=>{
 it('replays the complete unfinished task and a nonfinal Fake reset',()=>{
  let state=createGame(octS09.board);expect(isBlockSolved(state,state.blocks[0]!)).toBe(false);let reset=false;
  for(const letter of 'DLURDRRLDRRURDD'){const r=move(state,({U:'up',R:'right',D:'down',L:'left'} as const)[letter as 'U']!);expect(r.didMove).toBe(true);if(r.events.some(e=>e.type==='object-reset')){reset=true;expect(r.state.status).not.toBe('won');expect(r.state.player).toEqual({x:2,y:4});}state=r.state;}
  expect(reset).toBe(true);expect(state.status).toBe('won');
 });
 it('requires reset and decouples with one opening',()=>{
  const result=solveLevel(octS09,{...options,forbiddenConditions:octS09.theorem.proofConditions});expect(result.status).toBe('proven-unsolved');expect(result.diagnostics.completePlanWindow).toBe(true);
  const spec={...octS09,board:{...octS09.board,walls:octS09.board.walls.filter(p=>p.x!==4||p.y!==0)}};
  const free=solveLevel(spec,{...options,forbiddenConditions:octS09.theorem.proofConditions});expect(free.status).toBe('solved');expect([free.bestPlan?.moves,free.bestPlan?.pushes]).toEqual([11,2]);
  const overpruned={...spec,board:{...spec.board,walls:[...spec.board.walls,{x:3,y:2}]}};
  expect(solveLevel(overpruned,{...options,forbiddenConditions:octS09.theorem.proofConditions}).status).toBe('proven-unsolved');
 });
});
