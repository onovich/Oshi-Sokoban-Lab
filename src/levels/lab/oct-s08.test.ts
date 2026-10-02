import { describe, expect, it } from 'vitest';
import { octS08 } from './oct-s08';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
describe('octS08 conditional Gate reset scheduling',()=>{
 it('has an unfinished task and a real winning replay',()=>{
  let state=createGame(octS08.board);expect(isBlockSolved(state,state.blocks[0]!)).toBe(false);
  const r=solveLevel(octS08,options);expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([49,12]);
  for(const d of r.bestPlan!.directions){const m=move(state,d);expect(m.didMove).toBe(true);state=m.state;}expect(state.status).toBe('won');
 });
 it('requires each nonfinal origin/reset relation',()=>{
  for(const condition of octS08.theorem.proofConditions){const r=solveLevel(octS08,{...options,forbiddenConditions:[condition]});expect(r.status).toBe('proven-unsolved');expect(r.diagnostics.completePlanWindow).toBe(true);}
 });
 it('one north opening removes the whole relation',()=>{
  const spec={...octS08,board:{...octS08.board,walls:octS08.board.walls.filter(p=>p.x!==2||p.y!==0)}};
  const r=solveLevel(spec,{...options,forbiddenConditions:octS08.theorem.proofConditions});expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([11,5]);
 });
 it('Gate-to-Fake replacement creates a different short route',()=>{
  const spec={...octS08,board:{...octS08.board,gates:[],blocks:[...octS08.board.blocks,...octS08.board.gates.map(g=>({id:g.id,position:g.position,shape:g.shape,number:0,isFake:true}))]}};
  const r=solveLevel(spec,options);expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([17,5]);
 });
});
