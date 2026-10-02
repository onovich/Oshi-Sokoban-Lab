import { describe, expect, it } from 'vitest';
import { octS06 } from './oct-s06';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
describe('octS06 Goal reset before delivery',()=>{
 it('uses nonfinal Goal return to reverse transport direction',()=>{
  let state=createGame(octS06.board);expect(isBlockSolved(state,state.blocks[0]!)).toBe(false);let reset=false;
  for(const letter of 'LDDRDRUUDDLULLDDRR'){const r=move(state,({U:'up',R:'right',D:'down',L:'left'} as const)[letter as 'U']!);expect(r.didMove).toBe(true);if(r.events.some(e=>e.type==='object-reset')){reset=true;expect(r.state.status).not.toBe('won');expect(r.state.player).toEqual({x:3,y:1});expect(r.state.goals[0]!.position).toEqual({x:3,y:2});}state=r.state;}expect(reset).toBe(true);expect(state.status).toBe('won');
 });
 it('requires Goal reset unless a single independent approach is open',()=>{
  const r=solveLevel(octS06,{...options,forbiddenConditions:octS06.theorem.proofConditions});expect(r.status).toBe('proven-unsolved');expect(r.diagnostics.completePlanWindow).toBe(true);
  const spec={...octS06,board:{...octS06.board,walls:octS06.board.walls.filter(p=>p.x!==2||p.y!==1)}};
  const f=solveLevel(spec,{...options,forbiddenConditions:octS06.theorem.proofConditions});expect(f.status).toBe('solved');expect([f.bestPlan?.moves,f.bestPlan?.pushes]).toEqual([12,3]);
 });
});
