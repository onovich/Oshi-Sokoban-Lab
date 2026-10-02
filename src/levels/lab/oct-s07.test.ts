import { describe, expect, it } from 'vitest';
import { octS07 } from './oct-s07';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
describe('octS07 remote footprint reset',()=>{
 it('starts unfinished and uses a remote part to obtain the lower push side',()=>{
  let state=createGame(octS07.board);expect(isBlockSolved(state,state.blocks[0]!)).toBe(false);
  for(const letter of 'DLDR'){const r=move(state,({U:'up',R:'right',D:'down',L:'left'} as const)[letter as 'U']!);expect(r.didMove).toBe(true);state=r.state;}
  expect(state.blocks[0]!.position).toEqual({x:2,y:3});expect(state.player).toEqual({x:2,y:4});
  for(const letter of 'RUURULL'){const r=move(state,({U:'up',R:'right',D:'down',L:'left'} as const)[letter as 'U']!);expect(r.didMove).toBe(true);state=r.state;}
  expect(state.status).toBe('won');
 });
 it('exhausts every no-reset route and decouples with one opening',()=>{
  const banned=solveLevel(octS07,{...options,forbiddenConditions:octS07.theorem.proofConditions});
  expect(banned.status).toBe('proven-unsolved');expect(banned.diagnostics.completePlanWindow).toBe(true);
  const contrast={...octS07,board:{...octS07.board,walls:octS07.board.walls.filter(p=>p.x!==1||p.y!==2)}};
  const result=solveLevel(contrast,{...options,forbiddenConditions:octS07.theorem.proofConditions});
  expect(result.status).toBe('solved');expect([result.bestPlan?.moves,result.bestPlan?.pushes]).toEqual([11,4]);
 });
});
