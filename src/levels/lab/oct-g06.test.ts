import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG06 } from './oct-g06';

function withoutCrossPairControl(board: LevelDefinition) {
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
      if (turn.events.some(e => {
        if (e.type !== 'gate-pushed') return false;
        const gate = state.gates.find(g => g.id === e.entityId)!;
        const exit = state.gates.find(g => g.id === gate.nextGateId)!;
        return state.gates.some(g => {
          const origin = board.gates.find(v => v.id === g.id)!.position;
          return g.id !== gate.id && g.id !== exit.id && (g.position.x !== origin.x || g.position.y !== origin.y)
            && g.position.x === exit.position.x + e.to.x - e.from.x && g.position.y === exit.position.y + e.to.y - e.from.y;
        });
      })) continue;
      const signature = key(turn.state);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ ...turn.state, history: [] });
    }
  }
  return 'proven-unsolved';
}
it('requires moved endpoints of one pair to control the other pair', () => {
  let state = createGame(octG06.board);
  expect(state.status).toBe('playing');
  for (const letter of 'ULLDRUUDLLDRURDLURUURRRLDDUULDLULD') {
    const turn = move(state, (['up', 'right', 'down', 'left'] as const)['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true); state = turn.state;
  }
  expect(state.status).toBe('won');
  expect(withoutCrossPairControl(octG06.board)).toBe('proven-unsolved');
});
it('opening a return around the lower endpoint removes cross-pair permission coupling', () => {
  expect(withoutCrossPairControl({ ...octG06.board, walls: octG06.board.walls.filter(p => p.x !== 0 || p.y !== 3) })).toBe('solved');
});
