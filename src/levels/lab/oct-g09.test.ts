import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG09 } from './oct-g09';
function noRemoteBrake(board: LevelDefinition) {
  const initial = createGame(board), queue = [initial];
  const key = (s: typeof initial) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  const seen = new Set([key(initial)]), dirs = ['up', 'right', 'down', 'left'] as const;
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 20000) return 'budget-exhausted';
    const state = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const direction of dirs) {
      const turn = move(state, direction);
      if (!turn.didMove) continue;
      const forbidden = !turn.events.some(e => e.type === 'gate-traversed') && turn.events.some(e => {
        if (e.type !== 'rain-slid') return false;
        const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][dirs.indexOf(e.direction)]!;
        const gate = state.gates.find(g => g.position.x === e.to.x + dx! && g.position.y === e.to.y + dy!);
        if (!gate) return false;
        const exit = state.gates.find(g => g.id === gate.nextGateId)!;
        return state.blocks.some(b => {
          const origin = board.blocks.find(v => v.id === b.id)!.position;
          return (b.position.x !== origin.x || b.position.y !== origin.y) && b.position.x === exit.position.x + dx! && b.position.y === exit.position.y + dy!;
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
it('needs the task block to switch a remote portal into a local rain brake', () => {
  let state = createGame(octG09.board);
  expect(state.status).toBe('playing');
  for (const letter of 'RDRRLDRURURLURDLLDLULDLDLURDRULLRU') {
    const turn = move(state, (['up', 'right', 'down', 'left'] as const)['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true); state = turn.state;
  }
  expect(state.status).toBe('won'); expect(noRemoteBrake(octG09.board)).toBe('proven-unsolved');
});
it('an independent static stopping constraint removes dynamic remote braking', () => {
  expect(noRemoteBrake({ ...octG09.board, walls: [...octG09.board.walls, { x: 3, y: 0 }] })).toBe('solved');
});
