import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { octG10 } from './oct-g10';
function noResetAfterControl(board: LevelDefinition) {
  const initial = createGame(board), queue = [{ state: initial, controlled: 0 }];
  const key = (s: typeof initial, controlled: number) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position), controlled]);
  const seen = new Set([key(initial, 0)]);
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 20000) return 'budget-exhausted';
    const { state, controlled } = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const direction of ['up', 'right', 'down', 'left'] as const) {
      const turn = move(state, direction);
      if (!turn.didMove) continue;
      let nextControlled = controlled;
      for (const e of turn.events) {
        if (e.type !== 'gate-pushed') continue;
        const gi = state.gates.findIndex(g => g.id === e.entityId), gate = state.gates[gi]!, exit = state.gates.find(g => g.id === gate.nextGateId)!;
        if (state.blocks.some(b => {
          const origin = board.blocks.find(v => v.id === b.id)!.position;
          return (b.position.x !== origin.x || b.position.y !== origin.y) && b.position.x === exit.position.x + e.to.x - e.from.x && b.position.y === exit.position.y + e.to.y - e.from.y;
        })) nextControlled |= 1 << gi;
      }
      if (turn.events.some(e => e.type === 'death-reset')) nextControlled = 0;
      const preserved = turn.state.gates.some((g, i) => (nextControlled & (1 << i)) && (g.position.x !== board.gates[i]!.position.x || g.position.y !== board.gates[i]!.position.y));
      if (preserved && turn.events.some(e => e.type === 'object-reset' && e.entityType === 'block')) continue;
      const signature = key(turn.state, nextControlled);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ state: { ...turn.state, history: [] }, controlled: nextControlled });
    }
  }
  return 'proven-unsolved';
}
it('requires recovery of a block after it has licensed remote gate manipulation', () => {
  let state = createGame(octG10.board);
  expect(state.status).toBe('playing');
  for (const letter of 'DLLDDLLDDRRUULLLUURRDRRURULLDURRDLLLLULD') {
    const turn = move(state, (['up', 'right', 'down', 'left'] as const)['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true); state = turn.state;
  }
  expect(state.status).toBe('won'); expect(noResetAfterControl(octG10.board)).toBe('proven-unsolved');
});
it('opening the independent lower approach decouples the borrowed blocker and reset', () => {
  expect(noResetAfterControl({ ...octG10.board, walls: octG10.board.walls.filter(p => p.x !== 1 || p.y !== 2) })).toBe('solved');
});
