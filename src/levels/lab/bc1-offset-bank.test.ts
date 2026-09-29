import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { bc1OffsetBank } from './bc1-offset-bank';

// Finite one-block graph: no second movement implementation, only move().
function search(board: typeof bc1OffsetBank.board, forbidStop: boolean, forbidBelow: boolean) {
  const initial = createGame(board), queue = [initial];
  const key = (s: typeof initial) => JSON.stringify([s.player, s.blocks[0]!.position]);
  const seen = new Set([key(initial)]);
  const directions = ['up', 'right', 'down', 'left'] as const;
  const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 625) throw new Error('Budget exceeded: unknown, not proof');
    const state = queue[i]!;
    if (state.status === 'won') return true;
    for (let d = 0; d < 4; d++) {
      const result = move(state, directions[d]!), next = result.state;
      const before = state.blocks[0]!.position, after = next.blocks[0]!.position;
      if (!result.didMove || (forbidBelow && after.y > 2)) continue;
      if (forbidStop && before.x === after.x && before.y === after.y &&
        next.player.x + offsets[d]![0] === before.x && next.player.y + offsets[d]![1] === before.y) continue;
      const signature = key(next);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ ...next, history: [] });
    }
  }
  return false;
}

it('requires moving beyond the goal row before returning to it', () => {
  const report = solveLevel(bc1OffsetBank, { maximumStates: 5000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(bc1OffsetBank.board);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(bc1OffsetBank, { maximumStates: 5000, maximumPlans: 1,
    forbiddenConditions: bc1OffsetBank.theorem.proofConditions }).status).toBe('proven-unsolved');
});

it('needs both the below-goal staging and block-supported stop, unlike a static-stop contrast', () => {
  expect(search(bc1OffsetBank.board, true, false)).toBe(false);
  expect(search(bc1OffsetBank.board, false, true)).toBe(false);
  expect(search({ ...bc1OffsetBank.board, walls: [...bc1OffsetBank.board.walls, { x: 4, y: 1 }] }, true, true)).toBe(true);
});

it('goal-row alignment is recoverable, but does not itself supply the missing push side', () => {
  let state = createGame(bc1OffsetBank.board);
  for (const direction of ['up', 'left', 'down'] as const) state = move(state, direction).state;
  expect(state.blocks[0]!.position).toEqual({ x: 1, y: 2 });
  expect(move(state, 'left').didMove).toBe(false);
  for (const direction of ['right', 'down'] as const) state = move(state, direction).state;
  expect(state.player).toEqual({ x: 4, y: 4 });
  expect(move(state, 'left').didMove).toBe(false);
  // This is an unproductive plan, not a claimed deadlock: restart is unnecessary.
  expect(search({ ...bc1OffsetBank.board, player: state.player,
    blocks: bc1OffsetBank.board.blocks.map(b => ({ ...b, position: state.blocks[0]!.position })) }, false, false)).toBe(true);
});
