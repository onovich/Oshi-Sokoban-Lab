import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { be1OriginLoan } from './be1-origin-loan';

const directions = ['up', 'right', 'down', 'left'] as const;
function replay(route: string, state = createGame(be1OriginLoan.board)) {
  for (const letter of route) {
    const result = move(state, directions['URDL'.indexOf(letter)]!);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  return state;
}

it('solves by borrowing the origin, releasing it, and returning A behind the player', () => {
  expect(replay('RLLUURRDDRRLLL').status).toBe('won');
  const report = solveLevel(be1OriginLoan, { maximumStates: 30000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
});

type State = ReturnType<typeof createGame>;
type Result = ReturnType<typeof move>;
// Exhaustive only for this fixed clear-weather, single-cell Block board. All transitions use move().
function search(board = be1OriginLoan.board, forbidden?: (before: State, result: Result) => boolean) {
  const initial = createGame(board), queue = [initial];
  const key = (s: State) => JSON.stringify([s.player, ...s.blocks.map(b => b.position)]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 30000) throw new Error('Budget exhausted: unknown, not unsolved');
    const before = queue[i]!;
    if (before.status === 'won') return true;
    for (const direction of directions) {
      const result = move(before, direction);
      if (!result.didMove || forbidden?.(before, result)) continue;
      const signature = key(result.state);
      if (seen.has(signature)) continue;
      seen.add(signature); queue.push({ ...result.state, history: [] });
    }
  }
  return false;
}

const reset = (_s: State, r: Result) => r.events.some(e => e.type === 'object-reset');
it('cannot bypass reset, origin borrowing, or resetting after B releases its borrowed square', () => {
  expect(search(be1OriginLoan.board, reset)).toBe(false);
  expect(search(be1OriginLoan.board, (_s, r) => {
    const b = r.state.blocks[1]!.position; return b.x === 2 && b.y === 2;
  })).toBe(false);
  expect(search(be1OriginLoan.board, (s, r) => reset(s, r) && s.blocks[1]!.position.y === 3)).toBe(false);
  expect(solveLevel(be1OriginLoan, { maximumStates: 30000, maximumPlans: 1,
    forbiddenConditions: be1OriginLoan.theorem.proofConditions }).status).toBe('proven-unsolved');
});

it('lets the player try the occupied-origin hypothesis, then release it and obtain the far push side', () => {
  const occupied = replay('RRLLLUURRDULLDDRDRRU');
  expect(occupied.player).toEqual({ x: 3, y: 2 });
  expect(occupied.blocks.map(b => b.position)).toEqual([{ x: 4, y: 2 }, { x: 2, y: 2 }]);
  const failed = move(occupied, 'right');
  expect(failed.didMove).toBe(false);
  expect(failed.event).toMatch(/Reset conflict/);
  expect(failed.state).toEqual(occupied);
  const released = replay('DLLULUURRDDR', occupied);
  const returned = move(released, 'right');
  expect(returned.didMove).toBe(true);
  expect(returned.events).toContainEqual(expect.objectContaining({ type: 'object-reset',
    entityId: `${be1OriginLoan.id}-a`, from: { x: 5, y: 2 }, to: { x: 2, y: 2 },
    contactCells: [{ x: 5, y: 2 }] }));
  expect(returned.state.player).toEqual({ x: 4, y: 2 });
  expect(replay('LLL', returned.state).status).toBe('won');
});

it('a local upper bypass removes the need for remote reset access', () => {
  const contrast = { ...be1OriginLoan.board,
    walls: be1OriginLoan.board.walls.filter(p => !(p.x === 3 && (p.y === 0 || p.y === 1))) };
  expect(search(contrast, reset)).toBe(true);
  expect(replay('DRRULRUULDDL', createGame(contrast)).status).toBe('won');
});

it('distinguishes necessary transport cells from optional cells for testing the blocked-reset hypothesis', () => {
  for (const [x,y] of [[0,0],[1,0],[2,0],[0,1],[3,2],[4,2]]) {
    expect(search({ ...be1OriginLoan.board, walls: [...be1OriginLoan.board.walls, { x:x!, y:y! }] })).toBe(false);
  }
  for (const [x,y] of [[1,3],[3,3]]) {
    expect(search({ ...be1OriginLoan.board, walls: [...be1OriginLoan.board.walls, { x:x!, y:y! }] })).toBe(true);
  }
});
