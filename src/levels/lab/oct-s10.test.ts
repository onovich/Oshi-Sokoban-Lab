import { describe, expect, it } from 'vitest';
import { octS10 } from './oct-s10';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
describe('octS10 Fake returns to serve a second phase',()=>{
 it('replays reset, subsequent resource movement, and unfinished delivery',()=>{
  let state=createGame(octS10.board);expect(isBlockSolved(state,state.blocks[0]!)).toBe(false);
  const replay=(route:string)=>{for(const letter of route){const r=move(state,({U:'up',R:'right',D:'down',L:'left'} as const)[letter as 'U']!);expect(r.didMove).toBe(true);state=r.state;}};
  replay('RUURUL');expect(state.player).toEqual({x:2,y:0});expect(state.blocks[1]!.position).toEqual({x:2,y:1});expect(state.status).not.toBe('won');
  replay('DDD');expect(state.player).toEqual({x:2,y:3});expect(state.blocks[1]!.position).toEqual({x:2,y:4});expect(state.status).not.toBe('won');
  replay('RULLL');expect(state.status).toBe('won');
 });
 it('requires reset and subsequent reuse, not just the final delivery',()=>{
  for(const condition of octS10.theorem.proofConditions){const r=solveLevel(octS10,{...options,forbiddenConditions:[condition]});expect(r.status).toBe('proven-unsolved');expect(r.diagnostics.completePlanWindow).toBe(true);}
  const spec={...octS10,board:{...octS10.board,walls:octS10.board.walls.filter(p=>p.x!==3||p.y!==4)}};
  const r=solveLevel(spec,{...options,forbiddenConditions:octS10.theorem.proofConditions});expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([5,3]);
 });
});
