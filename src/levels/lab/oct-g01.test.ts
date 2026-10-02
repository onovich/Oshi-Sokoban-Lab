import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { LevelDefinition } from '../../engine/types';
import { solveLevel } from '../../solver/level-solver';
import { octG01 } from './oct-g01';

function withoutActivePush(board: LevelDefinition, gateId: string) {
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
        if (e.type !== 'gate-pushed' || e.entityId !== gateId) return false;
        const gate = state.gates.find(g => g.id === gateId)!;
        const exit = state.gates.find(g => g.id === gate.nextGateId)!;
        const dx = e.to.x - e.from.x, dy = e.to.y - e.from.y;
        return state.blocks.some(b => {
          const original = board.blocks.find(v => v.id === b.id)!;
          return b.shape.some(p => b.position.x + p.x === exit.position.x + dx && b.position.y + p.y === exit.position.y + dy)
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

it('needs player-created remote blockage at both ends, not merely two arbitrary gate pushes', () => {
  const report = solveLevel(octG01, { maximumStates: 20000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(octG01.board);
  expect(state.status).toBe('playing');
  for (const d of report.bestPlan!.directions) { const turn = move(state, d); expect(turn.didMove).toBe(true); state = turn.state; }
  expect(state.status).toBe('won');
  for (const gate of octG01.board.gates) expect(withoutActivePush(octG01.board, gate.id)).toBe('proven-unsolved');
});

it('removes the second remote-blocking requirement when the final pushing side is changed', () => {
  const board = { ...octG01.board, terrainGoals: [{ x: 3, y: 2 }, { x: 5, y: 2 }] };
  expect(withoutActivePush(board, octG01.board.gates[1]!.id)).toBe('solved');
});
