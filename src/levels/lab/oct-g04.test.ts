import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG04 } from './oct-g04';
const directions = ['up', 'right', 'down', 'left'] as const;
const delta = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
function withoutMovedGateStop(board: LevelDefinition) {
  const initial = createGame(board), queue = [initial];
  const key = (s: typeof initial) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i += 1) {
    if (queue.length > 20000) return 'budget-exhausted';
    const state = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const direction of directions) {
      const turn = move(state, direction);
      if (!turn.didMove) continue;
      if (turn.events.some(e => {
        if (e.type !== 'rain-slid') return false;
        const [dx, dy] = delta[directions.indexOf(e.direction)]!;
        return state.gates.some(g => {
          const initialGate = board.gates.find(v => v.id === g.id)!;
          return g.position.x === e.to.x + dx && g.position.y === e.to.y + dy
            && (g.position.x !== initialGate.position.x || g.position.y !== initialGate.position.y);
        });
      })) continue;
      const signature = key(turn.state);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ ...turn.state, history: [] });
    }
  }
  return 'proven-unsolved';
}
it('needs a displaced Gate as a rain stopper, while the literal route really solves', () => {
  let state = createGame(octG04.board);
  for (const letter of 'LDLURRRLDRUURUUL') { const turn = move(state, directions['URDL'.indexOf(letter)]!); expect(turn.didMove).toBe(true); state = turn.state; }
  expect(state.status).toBe('won');
  expect(withoutMovedGateStop(octG04.board)).toBe('proven-unsolved');
});
it('uses an independent fixed stopper instead when one is provided', () => {
  expect(withoutMovedGateStop({ ...octG04.board, walls: [...octG04.board.walls, { x: 1, y: 2 }] })).toBe('solved');
});
