import { describe, expect, it } from 'vitest';
import { octS05 } from './oct-s05';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
const directions = ['up','right','down','left'] as const;
function replay(route:string) {
  let state=createGame(octS05.board);
  for(const letter of route){const result=move(state,directions['URDL'.indexOf(letter)]!);expect(result.didMove).toBe(true);state=result.state;}
  return state;
}
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
describe('octS05 origin handoff',()=>{
  it('starts with both tasks unfinished and has a real winning replay',()=>{
    const initial=createGame(octS05.board);expect(initial.blocks.every(b=>!isBlockSolved(initial,b))).toBe(true);
    const result=solveLevel(octS05,options);expect(result.status).toBe('solved');expect(result.bestPlan?.moves).toBe(49);
    expect(replay(result.bestPlan!.directions.map(d=>d[0].toUpperCase()).join('')).status).toBe('won');
  });
  it('cannot bypass borrowing, B reset, or B-before-A reset coordination',()=>{
    for(const condition of octS05.theorem.proofConditions){
      const result=solveLevel(octS05,{...options,forbiddenConditions:[condition]});
      expect(result.status).toBe('proven-unsolved');expect(result.diagnostics.completePlanWindow).toBe(true);
    }
  });
  it('rejects reset while A is borrowing B origin',()=>{
    const occupied=replay('LLDLDRRDDLUURDR');
    expect(occupied.blocks.map(b=>b.position)).toEqual([{x:2,y:1},{x:4,y:2}]);
    const result=move(occupied,'up');expect(result.didMove).toBe(false);expect(result.event).toMatch(/Reset conflict/);
    expect(result.state).toEqual(occupied);
  });
  it('a single independent side opening removes all required reset and loan events',()=>{
    const contrast={...octS05,board:{...octS05.board,walls:octS05.board.walls.filter(p=>p.x!==3||p.y!==1)}};
    const result=solveLevel(contrast,{...options,forbiddenConditions:octS05.theorem.proofConditions});
    expect(result.status).toBe('solved');expect([result.bestPlan?.moves,result.bestPlan?.pushes]).toEqual([11,3]);
  });
});
