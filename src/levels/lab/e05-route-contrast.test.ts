import { expect, it } from 'vitest';
import { createGame, move, restart, undo } from '../../engine/game-engine';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e05LowerLanding, e05UpperLanding } from './e05-route-contrast';
import { auditLevelMutations } from '../level-mutation-audit';

it('makes the author-confirmed leftward clearing plan viable in the lower-goal context', () => {
  let state = createGame(e05LowerLanding.board);
  expect(state.blocks).toHaveLength(3);
  const result = move(state, 'left');
  expect(result.didMove).toBe(true);
  expect(result.state.blocks[2]!.position).toEqual({ x: 2, y: 4 });
  const report = searchSpatialExperiment(result.state, { maximumStates: 200000 });
  expect(report.status).toBe('solved');
  state = result.state;
  for (const direction of report.solution!) state = move(state, direction).state;
  expect(state.status).toBe('won');
});

for (const spec of [e05LowerLanding, e05UpperLanding]) {
  it(`${spec.board.title}: replays to victory and cannot bypass its non-final preparation`, () => {
    let state = createGame(spec.board);
    const report = searchSpatialExperiment(state, { maximumStates: 200000 });
    expect(report.status).toBe('solved');
    for (const direction of report.solution!) {
      const result = move(state, direction);
      expect(result.didMove).toBe(true);
      state = result.state;
    }
    expect(state.status).toBe('won');
    for (const condition of spec.theorem.proofConditions) {
      expect(searchSpatialExperiment(createGame(spec.board), {
        maximumStates: 200000, forbiddenConditions: [condition],
      }).status).toBe('proven-unsolved');
    }
  });

  it(`${spec.board.title}: explains every deletion and wall insertion`, () => {
    const report = auditLevelMutations(spec, 200000);
    expect(report.filter(result => result.classification === 'redundant')).toEqual([]);
    expect(report.some(result => ['invalid', 'inconclusive'].includes(result.effect))).toBe(false);
  }, 60000);
}

it('keeps a short execution tail after the upper route has been opened', () => {
  let state = createGame(e05UpperLanding.board);
  const report = searchSpatialExperiment(state, { maximumStates: 200000 });
  expect(report.status).toBe('solved');
  let opened = false;
  let pushes = 0;
  for (const direction of report.solution!) {
    const result = move(state, direction);
    if (opened) pushes += result.events.filter(event => event.type === 'block-pushed').length;
    if (result.events.some(event => event.type === 'block-pushed' && event.entityId.endsWith('-c') &&
      event.from.y === 3 && event.to.y === 2)) opened = true;
    state = result.state;
  }
  expect(opened).toBe(true);
  expect(pushes).toBeLessThanOrEqual(6);
});

it('retains lower-board comparison cells because each is indispensable in the upper variant', () => {
  for (const x of [2, 3, 4]) {
    const board = { ...e05UpperLanding.board, walls: [...e05UpperLanding.board.walls, { x, y: 5 }] };
    expect(searchSpatialExperiment(createGame(board), { maximumStates: 200000 }).status).toBe('proven-unsolved');
  }
});

it('changes only one goal and makes the same clearing move a recoverable-by-Undo mistake', () => {
  const { id: _lowerId, title: _lowerTitle, terrainGoals: _lowerGoals, blocks: lowerBlocks, ...lowerBoard } = e05LowerLanding.board;
  const { id: _upperId, title: _upperTitle, terrainGoals: _upperGoals, blocks: upperBlocks, ...upperBoard } = e05UpperLanding.board;
  expect(upperBoard).toEqual(lowerBoard);
  expect(upperBlocks.map(({ id: _id, ...block }) => block)).toEqual(lowerBlocks.map(({ id: _id, ...block }) => block));
  expect(e05UpperLanding.board.terrainGoals).toEqual(e05LowerLanding.board.terrainGoals.map(goal =>
    goal.x === 1 && goal.y === 4 ? { x: 3, y: 0 } : goal));
  const initial = createGame(e05UpperLanding.board);
  const wrong = move(initial, 'left');
  expect(wrong.didMove).toBe(true);
  expect(searchSpatialExperiment(wrong.state, { maximumStates: 200000 }).status).toBe('proven-unsolved');
  expect(searchSpatialExperiment(undo(wrong.state), { maximumStates: 200000 }).status).toBe('solved');
  expect(restart(wrong.state).blocks).toEqual(initial.blocks);
});
