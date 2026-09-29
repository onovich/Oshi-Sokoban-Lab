import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { rainSelfStop } from './rs10-rain-self-stop';

it('requires staging the unfinished block before using the left approach', () => {
  const options = { maximumStates: 10000, maximumPlans: 1 };
  const report = solveLevel(rainSelfStop, options);
  expect(report.status).toBe('solved');
  let state = createGame(rainSelfStop.board);
  expect(state.blocks.every(block => !isBlockSolved(state, block))).toBe(true);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(rainSelfStop, {
    ...options, forbiddenConditions: rainSelfStop.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
});

// This single-block, static board has at most 25 * 25 positional states.
// The engine remains the only source of transition rules; exhausted search
// and a budget failure are deliberately distinguished.
function search(weather: 'rain' | 'clear', forbidApproach: boolean) {
  const initial = createGame({ ...rainSelfStop.board, weather });
  const queue = [initial];
  const key = (state: typeof initial) => JSON.stringify([state.player, state.blocks[0]!.position]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 625) throw new Error('Unexpected state budget: necessity is unknown');
    const state = queue[i]!;
    if (state.status === 'won') return true;
    for (const direction of ['up', 'right', 'down', 'left'] as const) {
      const result = move(state, direction);
      const next = result.state;
      const block = state.blocks[0]!;
      const offset = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } }[direction];
      // Block-supported approach in any orientation; do not mandate one route.
      if (forbidApproach && result.didMove
        && next.blocks[0]!.position.x === block.position.x
        && next.blocks[0]!.position.y === block.position.y
        && next.player.x + offset.x === block.position.x
        && next.player.y + offset.y === block.position.y) continue;
      const signature = key(next);
      if (seen.has(signature)) continue;
      seen.add(signature);
      queue.push({ ...next, history: [] });
    }
  }
  return false;
}

it('needs the block-supported approach in rain but not in the clear-weather contrast', () => {
  expect(search('rain', false)).toBe(true);
  expect(search('rain', true)).toBe(false);
  expect(search('clear', true)).toBe(true);
});

it('the staged block supplies a stop, rather than a hidden floor condition', () => {
  let state = createGame(rainSelfStop.board);
  for (const direction of ['down', 'left', 'up', 'right', 'up', 'left', 'up', 'left'] as const) {
    state = move(state, direction).state;
  }
  expect(state.player).toEqual({ x: 2, y: 0 });
  expect(state.blocks[0]!.position).toEqual({ x: 2, y: 2 });
  expect(move(state, 'down').state.player).toEqual({ x: 2, y: 1 });
  // Local causal intervention, not a new level or a rule change.
  expect(move({ ...state, blocks: [] }, 'down').state.player).toEqual({ x: 2, y: 4 });
});
