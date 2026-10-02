import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG02 } from './oct-g02';

function search(board: LevelDefinition, forbidCorner: boolean) {
  const initial = createGame(board), queue = [{ state: initial, mask: 0 }];
  const signature = (s: typeof initial, m: number) => JSON.stringify([
    s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position), forbidCorner ? m : 0,
  ]);
  const seen = new Set([signature(initial, 0)]), directions = ['up', 'right', 'down', 'left'] as const;
  for (let i = 0; i < queue.length; i += 1) {
    if (queue.length > 20000) return 'budget-exhausted';
    const { state, mask } = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (let d = 0; d < 4; d += 1) {
      const turn = move(state, directions[d]!);
      if (!turn.didMove) continue;
      let nextMask = mask, denied = false;
      for (const e of turn.events) {
        if (e.type !== 'gate-pushed') continue;
        const g = state.gates.findIndex(v => v.id === e.entityId);
        if (forbidCorner && (mask & ((d % 2 === 0 ? 10 : 5) << (4 * g)))) denied = true;
        nextMask |= 1 << (g * 4 + d);
      }
      if (denied) continue;
      const key = signature(turn.state, nextMask);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: { ...turn.state, history: [] }, mask: nextMask });
    }
  }
  return 'proven-unsolved';
}

it('needs a gate to turn a corner to release the box transport row', () => {
  const directions = ['up', 'right', 'down', 'left'] as const;
  let state = createGame(octG02.board);
  for (const letter of 'UULLDLLDDRRDRURULDLDRRR') {
    const turn = move(state, directions['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true);
    state = turn.state;
  }
  expect(state.status).toBe('won');
  expect(search(octG02.board, true)).toBe('proven-unsolved');
});

it('allows a single-axis plan when an independent lower passage is provided', () => {
  const board = { ...octG02.board, walls: octG02.board.walls.filter(c => c.x !== 1 || c.y !== 3) };
  expect(search(board, true)).toBe('solved');
});
