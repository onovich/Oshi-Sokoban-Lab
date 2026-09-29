import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { bd2ShiftedEntry } from './bd2-shifted-entry';

const directions = ['up', 'right', 'down', 'left'] as const;
function replay(route: string) {
  let state = createGame(bd2ShiftedEntry.board), gatePushes = 0;
  for (const letter of route) {
    const turn = move(state, directions['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true);
    gatePushes += turn.events.filter(e => e.type === 'gate-pushed').length;
    state = turn.state;
  }
  return { state, gatePushes };
}

it('requires shifting the entry to finish the remote task, with real replay', () => {
  const options = { maximumStates: 20000, maximumPlans: 1 };
  const result = solveLevel(bd2ShiftedEntry, options);
  expect(result.status).toBe('solved');
  let state = createGame(bd2ShiftedEntry.board);
  expect(state.status).toBe('playing');
  for (const direction of result.bestPlan!.directions) {
    const turn = move(state, direction);
    expect(turn.didMove).toBe(true);
    state = turn.state;
  }
  expect(state.status).toBe('won');
  expect(solveLevel(bd2ShiftedEntry, { ...options,
    forbiddenConditions: bd2ShiftedEntry.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
});

it('uses the initial task block as the cause of entry pushing, not a new gate rule', () => {
  const before = replay('UL').state;
  const blocked = move(before, 'down');
  expect(blocked.events.some(e => e.type === 'gate-pushed')).toBe(true);
  expect(blocked.events.some(e => e.type === 'gate-traversed')).toBe(false);
  const cleared = { ...before, blocks: before.blocks.map(b => ({ ...b, position: { x: 4, y: 2 } })) };
  const traversed = move(cleared, 'down');
  expect(traversed.events.some(e => e.type === 'gate-traversed')).toBe(true);
  expect(traversed.events.some(e => e.type === 'gate-pushed')).toBe(false);
  expect(traversed.state.player).toEqual({ x: 5, y: 2 });
});

it('permits one gate push and removes gate pushing entirely with independent standing space', () => {
  const alternative = replay('ULDRDDLLURDLURDLD');
  expect(alternative.state.status).toBe('won');
  expect(alternative.gatePushes).toBe(1);
  const side = { ...bd2ShiftedEntry, board: { ...bd2ShiftedEntry.board,
    walls: bd2ShiftedEntry.board.walls.filter(c => c.x !== 0 || c.y !== 1),
  } };
  expect(solveLevel(side, { maximumStates: 20000, maximumPlans: 1,
    forbiddenConditions: [{ kind: 'event', event: { key: 'event:gate-pushed' } }],
  }).status).toBe('solved');
});
