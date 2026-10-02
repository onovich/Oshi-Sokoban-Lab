import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG07 } from './oct-g07';
function noReversal(board: LevelDefinition) {
  const initial = createGame(board), queue = [{ state: initial, mask: 0 }];
  const signature = (s: typeof initial, mask: number) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position), mask]);
  const seen = new Set([signature(initial, 0)]), dirs = ['up', 'right', 'down', 'left'] as const;
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 20000) return 'budget-exhausted';
    const { state, mask } = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (let d = 0; d < 4; d++) {
      const turn = move(state, dirs[d]!);
      if (!turn.didMove) continue;
      let nextMask = mask, denied = false;
      for (const e of turn.events) {
        if (e.type !== 'gate-pushed') continue;
        const g = state.gates.findIndex(v => v.id === e.entityId);
        if (mask & (1 << (g * 4 + (d + 2) % 4))) denied = true;
        nextMask |= 1 << (g * 4 + d);
      }
      if (denied) continue;
      const key = signature(turn.state, nextMask);
      if (seen.has(key)) continue;
      seen.add(key); queue.push({ state: { ...turn.state, history: [] }, mask: nextMask });
    }
  }
  return 'proven-unsolved';
}
it('requires endpoint recovery rather than monotonically clearing all gates', () => {
  let state = createGame(octG07.board);
  expect(state.status).toBe('playing');
  for (const letter of 'ULLDRUUDLLDRURDLURUURRDULDURRLDDULDLURURULL') {
    const turn = move(state, (['up', 'right', 'down', 'left'] as const)['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true); state = turn.state;
  }
  expect(state.status).toBe('won'); expect(noReversal(octG07.board)).toBe('proven-unsolved');
});
it('changes the strategy when only the final destination changes', () => {
  expect(noReversal({ ...octG07.board, terrainGoals: [{ x: 2, y: 2 }] })).toBe('solved');
});
