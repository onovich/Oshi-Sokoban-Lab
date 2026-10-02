import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { solveLevel } from '../../solver/level-solver';
import { octG03 } from './oct-g03';

function withoutActivePush(board: LevelDefinition) {
  const initial = createGame(board), queue = [initial];
  const key = (s: typeof initial) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i += 1) {
    if (queue.length > 20000) return 'budget-exhausted';
    const state = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const direction of ['up', 'right', 'down', 'left'] as const) {
      const turn = move(state, direction);
      if (!turn.didMove) continue;
      const forbidden = turn.events.some(e => {
        if (e.type !== 'gate-pushed') return false;
        const gate = state.gates.find(g => g.id === e.entityId)!;
        const exit = state.gates.find(g => g.id === gate.nextGateId)!;
        const dx = e.to.x - e.from.x, dy = e.to.y - e.from.y;
        return state.blocks.some(b => {
          const original = board.blocks.find(v => v.id === b.id)!;
          return b.isFake && b.shape.some(p => b.position.x + p.x === exit.position.x + dx && b.position.y + p.y === exit.position.y + dy)
            && (b.position.x !== original.position.x || b.position.y !== original.position.y);
        });
      });
      if (forbidden) continue;
      const signature = key(turn.state);
      if (seen.has(signature)) continue;
      seen.add(signature);
      queue.push({ ...turn.state, history: [] });
    }
  }
  return 'proven-unsolved';
}

it('needs Fake to control a remote gate permission, not just leave the task set', () => {
  const report = solveLevel(octG03, { maximumStates: 20000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(octG03.board);
  expect(state.status).toBe('playing');
  for (const d of report.bestPlan!.directions) { const turn = move(state, d); expect(turn.didMove).toBe(true); state = turn.state; }
  expect(state.status).toBe('won');
  expect(withoutActivePush(octG03.board)).toBe('proven-unsolved');
});

it('removes Fake control necessity with independent transport access', () => {
  const board = { ...octG03.board, walls: octG03.board.walls.filter(c => c.x !== 4 || c.y !== 2) };
  expect(withoutActivePush(board)).toBe('solved');
});
