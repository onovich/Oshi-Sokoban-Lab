import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG05 } from './oct-g05';

function withoutControl(board: LevelDefinition, banTraverse = false) {
  const initial = createGame(board), queue = [initial];
  const key = (s: typeof initial) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 20000) return 'budget-exhausted';
    const state = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const direction of ['up', 'right', 'down', 'left'] as const) {
      const turn = move(state, direction);
      if (!turn.didMove) continue;
      const forbidden = turn.events.some(e => {
        if (banTraverse) return e.type === 'gate-traversed';
        if (e.type !== 'gate-pushed') return false;
        const gate = state.gates.find(g => g.id === e.entityId)!;
        const exit = state.gates.find(g => g.id === gate.nextGateId)!;
        return state.blocks.some(b => {
          const original = board.blocks.find(v => v.id === b.id)!;
          return (b.position.x !== original.position.x || b.position.y !== original.position.y)
            && b.shape.slice(1).some(p => b.position.x + p.x === exit.position.x + e.to.x - e.from.x && b.position.y + p.y === exit.position.y + e.to.y - e.from.y);
        });
      });
      if (forbidden) continue;
      const signature = key(turn.state);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ ...turn.state, history: [] });
    }
  }
  return 'proven-unsolved';
}
it('replays a complete initially unsolved task and needs non-anchor footprint control', () => {
  let state = createGame(octG05.board);
  expect(state.status).toBe('playing');
  for (const letter of 'RRURDLURDDLUUULDDRRDLLLURDRUURRUL') {
    const turn = move(state, (['up', 'right', 'down', 'left'] as const)['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true); state = turn.state;
  }
  expect(state.status).toBe('won');
  expect(withoutControl(octG05.board)).toBe('proven-unsolved');
  expect(withoutControl(octG05.board, true)).toBe('proven-unsolved');
});
it('direct shape transport access removes the remote control requirement', () => {
  expect(withoutControl({ ...octG05.board, walls: octG05.board.walls.filter(p => p.x !== 1 || p.y !== 1) })).toBe('solved');
});
