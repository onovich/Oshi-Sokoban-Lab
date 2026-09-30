import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import type { GameState, LevelDefinition } from '../../engine/types';
import { solveLevel } from '../../solver/level-solver';
import { bd3ControlledEntry } from './bd3-controlled-entry';

const directions = ['up', 'right', 'down', 'left'] as const;
const delta = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

// Independent finite-state oracle. Rules still come exclusively from move().
function search(board: LevelDefinition, mode: 'noActivePush' | 'noReuse' | 'unrestricted') {
  const initial = createGame(board);
  const queue: { state: GameState; mask: number }[] = [{ state: initial, mask: 0 }];
  const signature = (state: GameState, mask: number) => JSON.stringify([
    state.player, ...state.blocks.map(b => b.position), ...state.gates.map(g => g.position),
    mode === 'noReuse' ? mask : 0,
  ]);
  const seen = new Set([signature(initial, 0)]);
  for (let i = 0; i < queue.length; i += 1) {
    if (queue.length > 20000) return 'budget-exhausted';
    const { state, mask } = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (let d = 0; d < 4; d += 1) {
      const turn = move(state, directions[d]!);
      if (!turn.didMove) continue;
      let nextMask = mask, activePush = false;
      for (const event of turn.events) {
        if (event.type !== 'gate-pushed') continue;
        const index = state.gates.findIndex(g => g.id === event.entityId);
        const gate = state.gates[index]!;
        const exit = state.gates.find(g => g.id === gate.nextGateId)!;
        const [dx, dy] = delta[d]!;
        const blocker = state.blocks.find(b => b.shape.some(p =>
          b.position.x + p.x === exit.position.x + dx && b.position.y + p.y === exit.position.y + dy));
        const original = board.blocks.find(b => b.id === blocker?.id);
        if (blocker && original && (blocker.position.x !== original.position.x || blocker.position.y !== original.position.y)) {
          activePush = true;
          nextMask |= 1 << index;
        }
      }
      if (mode === 'noActivePush' && activePush) continue;
      if (mode === 'noReuse' && turn.events.some(e => e.type === 'gate-traversed'
        && (mask & (1 << state.gates.findIndex(g => g.id === e.entryGateId))))) continue;
      const key = signature(turn.state, nextMask);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: { ...turn.state, history: [] }, mask: nextMask });
    }
  }
  return 'proven-unsolved';
}

it('requires player-created remote blockage and later reuse of the affected Gate', () => {
  const report = solveLevel(bd3ControlledEntry, { maximumStates: 20000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(bd3ControlledEntry.board);
  expect(state.status).toBe('playing');
  for (const direction of report.bestPlan!.directions) {
    const turn = move(state, direction);
    expect(turn.didMove).toBe(true);
    state = turn.state;
  }
  expect(state.status).toBe('won');
  expect(search(bd3ControlledEntry.board, 'noActivePush')).toBe('proven-unsolved');
  expect(search(bd3ControlledEntry.board, 'noReuse')).toBe('proven-unsolved');
  expect(solveLevel(bd3ControlledEntry, { maximumStates: 20000, maximumPlans: 1,
    forbiddenConditions: bd3ControlledEntry.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
});

it('removes active blocking necessity when the entrance no longer occupies the transport line', () => {
  const board = { ...bd3ControlledEntry.board, gates: bd3ControlledEntry.board.gates.map((g, i) =>
    i === 0 ? { ...g, position: { x: 2, y: 2 } } : g) };
  expect(search(board, 'noActivePush')).toBe('solved');
});

it('loses solvability when any of the fourteen initially unoccupied ordinary floor cells is walled off', () => {
  const board = bd3ControlledEntry.board;
  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  const excluded = new Set([
    key(board.player), ...board.walls.map(key), ...board.terrainGoals.map(key),
    ...board.blocks.map(b => key(b.position)), ...board.gates.map(g => key(g.position)),
  ]);
  let checked = 0;
  for (let y = 0; y < board.height; y += 1) for (let x = 0; x < board.width; x += 1) {
    const cell = { x, y };
    if (excluded.has(key(cell))) continue;
    checked += 1;
    expect(search({ ...board, walls: [...board.walls, cell] }, 'unrestricted'), `wall at ${key(cell)}`)
      .toBe('proven-unsolved');
  }
  // This measures only single ordinary-floor closures, not all possible mutations.
  expect(checked).toBe(14);
});
