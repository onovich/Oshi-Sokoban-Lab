import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { rainPlacement } from './rs08-rain-placement';

it('requires the intermediate placement and replays to a complete win', () => {
  const options = { maximumStates: 80000, maximumPlans: 1 };
  const report = solveLevel(rainPlacement, options);
  expect(report.status).toBe('solved');
  let state = createGame(rainPlacement.board);
  expect(state.blocks.every(block => !isBlockSolved(state, block))).toBe(true);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(rainPlacement, {
    ...options, forbiddenConditions: rainPlacement.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
});

it('contrasts too short, useful, and too far without changing the rain rules', () => {
  const initial = createGame(rainPlacement.board);
  const once = move(initial, 'right').state;
  const twice = move(once, 'right').state;
  const threeTimes = move(twice, 'right').state;
  const approach = (state: typeof initial) => {
    for (const direction of ['down', 'right', 'up'] as const) state = move(state, direction).state;
    return state;
  };
  let shortApproach = once;
  for (const direction of ['up', 'right', 'down', 'up'] as const) shortApproach = move(shortApproach, direction).state;
  expect(shortApproach.player).toEqual({ x: 4, y: 0 });
  const useful = approach(twice);
  expect(useful.player).toEqual({ x: 4, y: 2 });
  expect(move(useful, 'left').state.blocks[1]!.position).toEqual({ x: 2, y: 2 });
  expect(threeTimes.blocks[0]!.position).toEqual({ x: 4, y: 1 });
  const overshot = { ...rainPlacement, board: {
    ...rainPlacement.board, player: threeTimes.player, blocks: threeTimes.blocks,
  } };
  expect(solveLevel(overshot, { maximumStates: 80000, maximumPlans: 1 }).status).toBe('proven-unsolved');
});
