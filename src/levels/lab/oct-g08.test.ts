import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG08 } from './oct-g08';
function noGoalEntry(board: LevelDefinition) {
  const initial = createGame(board), queue = [initial];
  const key = (s: typeof initial) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 50000) return 'budget-exhausted';
    const state = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const direction of ['up', 'right', 'down', 'left'] as const) {
      const turn = move(state, direction);
      if (!turn.didMove || turn.events.some(e => e.type === 'gate-traversed' && board.terrainGoals.some(g => g.x === e.entry.x && g.y === e.entry.y))) continue;
      const signature = key(turn.state);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ ...turn.state, history: [] });
    }
  }
  return 'proven-unsolved';
}
it('borrows a goal for an actual entrance before releasing it for a task block', () => {
  let state = createGame(octG08.board);
  expect(state.status).toBe('playing');
  for (const letter of 'DDRRDDLLURDDRDLLURURULDLULLDRDRRUULD') {
    const turn = move(state, (['up', 'right', 'down', 'left'] as const)['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true); state = turn.state;
  }
  expect(state.status).toBe('won'); expect(noGoalEntry(octG08.board)).toBe('proven-unsolved');
});
it('an independent upper approach removes the shared entrance/goal requirement', () => {
  expect(noGoalEntry({ ...octG08.board, walls: octG08.board.walls.filter(p => p.x !== 3 || p.y !== 0) })).toBe('solved');
});
