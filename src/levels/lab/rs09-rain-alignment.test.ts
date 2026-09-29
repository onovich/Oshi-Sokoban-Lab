import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { rainAlignment } from './rs09-rain-alignment';
import { rainRelease } from './rs07-rain-release';
import type { Direction, GameState } from '../../engine/types';

const replay = (state: GameState, directions: readonly Direction[]) => {
  for (const direction of directions) state = move(state, direction).state;
  return state;
};

it('requires repositioning the horizontal stop before releasing the small block', () => {
  const options = { maximumStates: 80000, maximumPlans: 1 };
  const report = solveLevel(rainAlignment, options);
  expect(report.status).toBe('solved');
  let state = createGame(rainAlignment.board);
  expect(state.blocks.every(block => !isBlockSolved(state, block))).toBe(true);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(rainAlignment, {
    ...options, forbiddenConditions: rainAlignment.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
});

it('breaks the recalled eleven-move route and changes the actual release-side stop', () => {
  const recalled: readonly Direction[] = ['right', 'right', 'down', 'right', 'up', 'left', 'left', 'up', 'right', 'down', 'down'];
  expect(replay(createGame(rainRelease.board), recalled).status).toBe('won');
  expect(replay(createGame(rainAlignment.board), recalled).status).not.toBe('won');

  const unadjusted = replay(createGame(rainAlignment.board), ['right', 'right', 'down', 'right', 'up']);
  expect(unadjusted.player).toEqual({ x: 4, y: 2 });
  expect(move(unadjusted, 'left').state.blocks[1]!.position).toEqual({ x: 3, y: 3 });

  const adjusted = replay(createGame(rainAlignment.board), [
    'right', 'right', 'up', 'right', 'down', 'left', 'down', 'right', 'down', 'right', 'up',
  ]);
  expect(adjusted.blocks[0]!.position).toEqual({ x: 3, y: 2 });
  expect(adjusted.player).toEqual({ x: 4, y: 3 });
  const released = move(adjusted, 'left').state;
  expect(released.blocks[1]!.position).toEqual({ x: 2, y: 3 });
  const finished = replay(released, ['left', 'up', 'right', 'down', 'down', 'down']);
  expect(finished.status).toBe('won');
});
