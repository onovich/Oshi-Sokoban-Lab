import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved, undo, restart } from '../../engine/game-engine';
import type { GameState, Direction } from '../../engine/types';
import { evaluateProofConditions } from '../../course/proof-evaluator';
import { auditLevelMutations } from '../level-mutation-audit';
import { e03GoalSpaceLevels, e03SideCourt } from './e03-goal-space';
import { searchSpatialExperiment } from './spatial-experiment-search';

const occupies = (state: GameState, x: number, y: number) => state.blocks.some(block =>
  block.shape.some(part => block.position.x + part.x === x && block.position.y + part.y === y));

it.each(e03GoalSpaceLevels)('$id must use and release the temporary complete footprint', (spec) => {
  const board = spec.board;
  const initial = createGame(board);
  const report = searchSpatialExperiment(initial);
  expect(report.status).toBe('solved');
  let state = initial;
  const batches = report.solution!.map(direction => {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
    return { events: result.events, pushes: result.events.filter(e => e.type === 'block-pushed').length };
  });
  expect(state.status).toBe('won');
  expect(evaluateProofConditions(spec.theorem.proofConditions, batches).every(p => p.satisfied)).toBe(true);
  expect(board.terrainGoals.length).toBe(initial.blocks.flatMap(b => b.shape).length + 1);
  for (const mode of ['enter', 'leave']) {
    const constrained = searchSpatialExperiment(initial, { forbiddenTransition: (before, result) => {
      const was = occupies(before, 2, 0);
      const now = occupies(result.state, 2, 0);
      return mode === 'enter' ? !was && now : was && !now;
    } });
    expect(constrained.status).toBe('proven-unsolved');
    expect(constrained.forbiddenTransitions).toBeGreaterThan(0);
  }
  for (const condition of spec.theorem.proofConditions) {
    expect(searchSpatialExperiment(initial, { forbiddenConditions: [condition] }).status).toBe('proven-unsolved');
  }
  const first = move(initial, 'up');
  expect(isBlockSolved(first.state, first.state.blocks.find(b => b.id.endsWith('-c'))!)).toBe(true);
  expect(first.state.status).toBe('playing');
  expect(undo(first.state)).toEqual(initial);
  expect(restart(first.state)).toEqual(initial);
});

it.each(e03GoalSpaceLevels)('$id decouples the push-side conflict using a player-only west passage', spec => {
  const passage = [{x:0,y:1},{x:0,y:2},{x:0,y:3}];
  const board = { ...spec.board, walls: spec.board.walls.filter(c => !passage.some(p => p.x === c.x && p.y === c.y)) };
  const staged = move(createGame(board), 'up');
  expect(staged.didMove).toBe(true);
  expect(occupies(staged.state, 2, 0)).toBe(true);
  const result = searchSpatialExperiment(staged.state, { forbiddenTransition: (before, result) =>
    passage.some(p => occupies(result.state, p.x, p.y)) ||
    (occupies(before, 2, 0) && !occupies(result.state, 2, 0)),
  });
  expect(result.status, JSON.stringify(result)).toBe('solved');
  let state = staged.state;
  for (const direction of result.solution!) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(occupies(state, 2, 0)).toBe(true);
});

it.each(e03GoalSpaceLevels)('$id audits deletion and wall mutations without disguising unknowns', spec => {
  const report = auditLevelMutations(spec, 100000);
  expect(report.filter(r => r.classification === 'redundant')).toEqual([]);
  expect(report.some(r => ['invalid', 'inconclusive'].includes(r.effect))).toBe(false);
  expect(report.filter(r => r.classification === 'readability').map(r => r.target)).toEqual(['terrain-goal:2,0']);
}, 30000);

it('does not reduce the horizontal task to an independent before-or-after puzzle', () => {
  const initial = createGame(e03SideCourt.board);
  const postponeAllBPushes = searchSpatialExperiment(initial, { forbiddenTransition: (before, result) =>
    !isBlockSolved(before, before.blocks.find(b => b.id.endsWith('-a'))!) &&
    result.events.some(e => e.type === 'block-pushed' && e.entityId.endsWith('-b')),
  });
  expect(postponeAllBPushes.status).toBe('proven-unsolved');
  const postponeAllAPushes = searchSpatialExperiment(initial, { forbiddenTransition: (before, result) =>
    !isBlockSolved(before, before.blocks.find(b => b.id.endsWith('-b'))!) &&
    result.events.some(e => e.type === 'block-pushed' && e.entityId.endsWith('-a')),
  });
  expect(postponeAllAPushes.status).toBe('proven-unsolved');
});

it.each(e03GoalSpaceLevels)('$id enumerates every reachable terminal assignment, including swapped allocations', spec => {
  const initial = createGame(spec.board);
  const key = (s: GameState) => [s.player, ...s.blocks.map(b => b.position)].map(p => `${p.x},${p.y}`).join('|');
  const queue = [initial];
  const seen = new Set([key(initial)]);
  const assignments = new Set<string>();
  let explored = 0;
  while (explored < queue.length && explored < 100000) {
    const state = queue[explored++]!;
    if (state.status === 'won') {
      expect(occupies(state, 2, 0)).toBe(false);
      assignments.add(state.blocks.map(b => `${b.id.slice(-1)}:${b.position.x},${b.position.y}`).join('|'));
      continue;
    }
    for (const direction of ['up', 'right', 'down', 'left'] as const satisfies readonly Direction[]) {
      const result = move(state, direction);
      if (!result.didMove || seen.has(key(result.state))) continue;
      seen.add(key(result.state));
      queue.push({ ...result.state, history: [] });
    }
  }
  expect(explored).toBe(queue.length); // A budget cutoff is not an exhaustive proof.
  expect([...assignments]).toEqual([spec === e03SideCourt ? 'a:1,2|c:0,0|b:3,2' : 'a:1,2|c:0,0']);
});

it.each(e03GoalSpaceLevels)('$id separates the temporary Goal cue from the spatial rule', spec => {
  const bareBoard = { ...spec.board, terrainGoals: spec.board.terrainGoals.filter(c => c.x !== 2 || c.y !== 0) };
  const original = searchSpatialExperiment(createGame(spec.board));
  const bare = searchSpatialExperiment(createGame(bareBoard));
  expect(bare.status).toBe('solved');
  expect(bare.solution).toEqual(original.solution);
  const originalFirst = move(createGame(spec.board), 'up').state;
  const bareFirst = move(createGame(bareBoard), 'up').state;
  expect(originalFirst.blocks.map(b => b.position)).toEqual(bareFirst.blocks.map(b => b.position));
  expect(isBlockSolved(originalFirst, originalFirst.blocks[1]!)).toBe(true);
  expect(isBlockSolved(bareFirst, bareFirst.blocks[1]!)).toBe(false);
});
