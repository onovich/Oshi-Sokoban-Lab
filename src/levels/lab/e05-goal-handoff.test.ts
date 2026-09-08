import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved, undo, restart } from '../../engine/game-engine';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e05GoalHandoff } from './e05-goal-handoff';
import { auditLevelMutations } from '../level-mutation-audit';

it('makes the apparent left-goal assignment testable and recoverable with Undo', () => {
  const initial=createGame(e05GoalHandoff.board);
  let state=initial;
  for(const d of ['up','right','right','down'] as const) {
    const result=move(state,d);
    expect(result.didMove).toBe(true);
    state=result.state;
  }
  const attempt=move(state,'left');
  expect(attempt.didMove).toBe(true);
  expect(attempt.state.blocks[1]!.position).toEqual({x:1,y:2});
  expect(searchSpatialExperiment(attempt.state).status).toBe('proven-unsolved');
  expect(undo(attempt.state)).toEqual(state);
  expect(searchSpatialExperiment(state).status).toBe('solved');
  expect(restart(attempt.state)).toEqual(initial);
});

it('accounts for all floor and object mutations', () => {
  const report=auditLevelMutations(e05GoalHandoff,200000);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
});

it('isolates the shared-target handoff without the vertical transport task', () => {
  let state=createGame(e05GoalHandoff.board);
  expect(state.blocks).toHaveLength(2);
  const report=searchSpatialExperiment(state);
  expect(report.status).toBe('solved');
  for(const d of report.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
  expect(searchSpatialExperiment(createGame(e05GoalHandoff.board),{forbiddenConditions:e05GoalHandoff.theorem.proofConditions}).status).toBe('proven-unsolved');
  const forbiddenTransition=(before:typeof state,result:ReturnType<typeof move>)=>result.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-b')&&isBlockSolved(before,before.blocks[0]!));
  expect(searchSpatialExperiment(createGame(e05GoalHandoff.board),{forbiddenTransition}).status).toBe('proven-unsolved');
  const contrast={...e05GoalHandoff.board,terrainGoals:e05GoalHandoff.board.terrainGoals.map(p=>p.x===0&&p.y===0 ? {x:3,y:0} : p)};
  state=createGame(contrast);
  const alternate=searchSpatialExperiment(state,{forbiddenTransition});
  expect(alternate.status).toBe('solved');
  for(const d of alternate.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
});
