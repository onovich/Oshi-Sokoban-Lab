import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved, undo, restart } from '../../engine/game-engine';
import { auditLevelMutations } from '../level-mutation-audit';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e05SharedBridge } from './e05-shared-bridge';

it('keeps three interacting objects and offers a legal replay to completion', () => {
  let state = createGame(e05SharedBridge.board);
  expect(state.blocks).toHaveLength(3);
  const report = searchSpatialExperiment(state, { maximumStates: 200000 });
  expect(report.status).toBe('solved');
  for (const direction of report.solution!) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.status).toBe('won');
});

it('the tempting nearby completion is legal but loses the return route, and can be undone', () => {
  let state = createGame(e05SharedBridge.board);
  for (const direction of ['up', 'right', 'down', 'left', 'down', 'right'] as const) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(isBlockSolved(state, state.blocks[0]!)).toBe(true);
  expect(searchSpatialExperiment(state, { maximumStates: 200000 }).status).toBe('proven-unsolved');
  // The commitment is the first downward push, not its later visible completion.
  expect(searchSpatialExperiment(undo(state), { maximumStates: 200000 }).status).toBe('proven-unsolved');
  expect(searchSpatialExperiment(undo(undo(undo(undo(state)))), { maximumStates: 200000 }).status).toBe('solved');
  expect(restart(state).blocks).toEqual(createGame(e05SharedBridge.board).blocks);
});

it('moving one goal releases the need to rearrange a completed object', () => {
  const board = { ...e05SharedBridge.board, terrainGoals: e05SharedBridge.board.terrainGoals.map(
    goal => goal.x === 0 && goal.y === 0 ? { x: 3, y: 0 } : goal,
  ) };
  let state = createGame(board);
  const report = searchSpatialExperiment(state, {
    maximumStates: 200000,
    forbiddenTransition: (before, result) => result.events.some(event =>
      event.type === 'block-pushed' && event.entityId.endsWith('-b') &&
      isBlockSolved(before, before.blocks[1]!)),
  });
  expect(report.status).toBe('solved');
  for (const direction of report.solution!) state = move(state, direction).state;
  expect(state.status).toBe('won');
});

it('cannot bypass rearranging the completed horizontal object', () => {
  const initial = createGame(e05SharedBridge.board);
  expect(searchSpatialExperiment(initial, {
    maximumStates: 200000, forbiddenConditions: e05SharedBridge.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
  expect(searchSpatialExperiment(initial, {
    maximumStates: 200000,
    forbiddenTransition: (before, result) => result.events.some(event =>
      event.type === 'block-pushed' && event.entityId.endsWith('-b') &&
      isBlockSolved(before, before.blocks[1]!)),
  }).status).toBe('proven-unsolved');
});

it('accounts for every object, goal and available floor mutation', () => {
  const report = auditLevelMutations(e05SharedBridge, 200000);
  expect(report.filter(result => result.classification === 'redundant')).toEqual([]);
  expect(report.some(result => ['invalid', 'inconclusive'].includes(result.effect))).toBe(false);
}, 60000);
