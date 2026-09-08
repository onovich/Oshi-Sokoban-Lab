import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { e03Alcove } from './e03-goal-space';
import { e03WestCourt } from './e03-boundary';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { auditLevelMutations } from '../level-mutation-audit';

it('requires the previously spare upper Goal rather than its old final allocation', () => {
  const initial = createGame(e03WestCourt.board);
  const result = searchSpatialExperiment(initial, { forbiddenTransition: (_before, result) =>
    result.state.status === 'won' && result.state.blocks.find(b => b.id.endsWith('-c'))!.position.x === 2,
  });
  expect(result.status).toBe('proven-unsolved');
  const solution = searchSpatialExperiment(initial);
  expect(solution.status).toBe('solved');
  let state = initial;
  for (const direction of solution.solution!) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(state.blocks.find(b => b.id.endsWith('-c'))!.position).toEqual({ x: 2, y: 0 });
});

it('requires the western player route, not a victory event masquerading as a technique', () => {
  const initial = createGame(e03WestCourt.board);
  expect(searchSpatialExperiment(initial, { forbiddenTransition: (_before, result) =>
    result.state.player.x === 0 && result.state.player.y === 1,
  }).status).toBe('proven-unsolved');
  expect(searchSpatialExperiment(initial, { forbiddenConditions: e03WestCourt.theorem.proofConditions }).status)
    .toBe('proven-unsolved');
});

it('isolates the two route changes while keeping all targets and objects in place', () => {
  expect(e03WestCourt.board.terrainGoals).toEqual(e03Alcove.board.terrainGoals);
  expect(e03WestCourt.board.player).toEqual(e03Alcove.board.player);
  expect(e03WestCourt.board.blocks.map(({ id: _id, ...b }) => b))
    .toEqual(e03Alcove.board.blocks.map(({ id: _id, ...b }) => b));
  const bothRoutes = { ...e03WestCourt.board, walls: e03WestCourt.board.walls.filter(p => p.x !== 3 || p.y !== 0) };
  for (const forbiddenX of [0, 2]) {
    expect(searchSpatialExperiment(createGame(bothRoutes), { forbiddenTransition: (_before, result) =>
      result.state.status === 'won' && result.state.blocks[1]!.position.x === forbiddenX,
    }).status).toBe('solved');
  }
  const neitherRoute = { ...e03WestCourt.board, walls: [...e03WestCourt.board.walls,
    { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
  ] };
  expect(searchSpatialExperiment(createGame(neitherRoute)).status).toBe('proven-unsolved');
});

it('explains every deletion or sealing mutation', () => {
  const report = auditLevelMutations(e03WestCourt, 100000);
  expect(report.filter(r => r.classification === 'redundant')).toEqual([]);
  expect(report.filter(r => r.classification === 'readability').map(r => r.target)).toEqual(['terrain-goal:0,0']);
  expect(report.some(r => ['invalid', 'inconclusive'].includes(r.effect))).toBe(false);
}, 30000);
