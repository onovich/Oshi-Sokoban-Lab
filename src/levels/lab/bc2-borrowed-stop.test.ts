import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { bc2BorrowedStop } from './bc2-borrowed-stop';

const directions = ['up', 'right', 'down', 'left'] as const;
function replay(route: string, board = bc2BorrowedStop.board) {
  let state = createGame(board);
  for (const letter of route) {
    const result = move(state, directions['URDL'.indexOf(letter)]!);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  return state;
}

// Positional state plus one immediately preceding support flag. No movement rules copied.
function search(board: typeof bc2BorrowedStop.board, forbidSupport = false) {
  const initial = createGame(board);
  const queue: { state: typeof initial; pending: boolean }[] = [{ state: initial, pending: false }];
  const key = (s: typeof initial, pending: boolean) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), pending]);
  const seen = new Set([key(initial, false)]);
  const offsets = [[0,-1], [1,0], [0,1], [-1,0]] as const;
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 16000) throw new Error('Budget exceeded: unknown');
    const { state, pending } = queue[i]!;
    if (state.status === 'won') return true;
    for (let d = 0; d < 4; d++) {
      const result = move(state, directions[d]!), next = result.state;
      if (!result.didMove) continue;
      const changed = (index: number) => state.blocks[index]!.position.x !== next.blocks[index]!.position.x
        || state.blocks[index]!.position.y !== next.blocks[index]!.position.y;
      if (forbidSupport && pending && changed(1)) continue;
      const a = next.blocks[0]!.position;
      const nextPending = !changed(0) && !changed(1)
        && next.player.x + offsets[d]![0] === a.x && next.player.y + offsets[d]![1] === a.y;
      const signature = key(next, nextPending);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ state: { ...next, history: [] }, pending: nextPending });
    }
  }
  return false;
}

it('needs A-supported access to B, unless the floor supplies a static stop', () => {
  expect(search(bc2BorrowedStop.board, true)).toBe(false);
  expect(search({ ...bc2BorrowedStop.board,
    walls: [...bc2BorrowedStop.board.walls, { x: 3, y: 4 }] }, true)).toBe(true);
});

it('borrows an unfinished block as a stop and can still finish both tasks', () => {
  const report = solveLevel(bc2BorrowedStop, { maximumStates: 20000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(bc2BorrowedStop.board);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
});

it('A changes the stopping location needed for the immediate B push', () => {
  const state = replay('DRRDRDLUR');
  expect(state.player).toEqual({ x: 3, y: 3 });
  const stopped = move(state, 'up').state;
  expect(stopped.player).toEqual({ x: 3, y: 2 });
  expect(move(stopped, 'left').state.blocks[1]!.position).toEqual({ x: 1, y: 2 });
  const withoutA = move({ ...state, blocks: [state.blocks[1]!] }, 'up').state;
  expect(withoutA.player).toEqual({ x: 3, y: 0 });
});

it('finishing A too early is dead, but both late finishing orders remain valid', () => {
  const early = replay('DRRDRU');
  expect(early.blocks[0]!.position).toEqual({ x: 3, y: 0 });
  expect(search({ ...bc2BorrowedStop.board, player: early.player,
    blocks: bc2BorrowedStop.board.blocks.map((block, index) => ({ ...block, position: early.blocks[index]!.position })) })).toBe(false);
  expect(replay('DRRDRDLURULRULURDD').status).toBe('won');
  // Explicit counterexample to the stronger, incorrect claim that A must finish before B.
  expect(replay('DRRDRDLURULULURDDRU').status).toBe('won');
});

it('requires the B staging landmark but does not mistake it for the entire proof', () => {
  expect(solveLevel(bc2BorrowedStop, { maximumStates: 20000, maximumPlans: 1,
    forbiddenConditions: bc2BorrowedStop.theorem.proofConditions }).status).toBe('proven-unsolved');
});
