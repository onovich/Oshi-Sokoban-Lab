import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { bb2GoalPermission } from './bb2-goal-permission';
import type { Direction, GameState } from '../../engine/types';

const directions = ['up', 'right', 'down', 'left'] as const;
const offsets = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
function replay(route: string) {
  let state = createGame(bb2GoalPermission.board);
  for (const letter of route) state = move(state, directions['URDL'.indexOf(letter)]!).state;
  return state;
}

function withoutBoxCrossing(walls = bb2GoalPermission.board.walls) {
  const initial = createGame({ ...bb2GoalPermission.board, walls });
  const key = (s: GameState) => JSON.stringify([s.player, s.blocks.map(b => b.position), s.goals.map(g => g.position)]);
  const queue = [initial], seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i++) {
    if (queue.length > 20000) return 'budget-exhausted';
    const state = queue[i]!;
    if (state.status === 'won') return 'solved';
    for (const [index, direction] of directions.entries()) {
      const turn = move(state, direction);
      if (!turn.didMove) continue;
      const offset = offsets[index]!;
      const crossesBoxBlockedGoal = turn.events.some(e => e.type === 'goal-crossed'
        && state.blocks.some(b => b.position.x === e.at.x + offset.x && b.position.y === e.at.y + offset.y));
      if (crossesBoxBlockedGoal) continue;
      const fingerprint = key(turn.state);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      queue.push({ ...turn.state, history: [] });
    }
  }
  return 'proven-unsolved';
}

it('requires both moving and crossing the same Goal in a complete playable puzzle', () => {
  const spec = bb2GoalPermission;
  let state = createGame(spec.board);
  const directions = ['up', 'right', 'down', 'left'] as const;
  for (const letter of 'LDRDUURLLUDRDLUULD') {
    const turn = move(state, directions['URDL'.indexOf(letter)]!);
    expect(turn.didMove).toBe(true);
    state = turn.state;
  }
  expect(state.status).toBe('won');
  for (const key of ['event:goal-pushed', 'event:goal-crossed'] as const) {
    expect(solveLevel(spec, { maximumStates: 20000, maximumPlans: 1,
      forbiddenConditions: [{ kind: 'event', event: { key } }],
    }).status).toBe('proven-unsolved');
  }
});

it('requires using a box as the reason Goal is crossable, not just any final push', () => {
  expect(withoutBoxCrossing()).toBe('proven-unsolved');
});

it('changes the same input from crossing to pushing when its immediate blocker is removed', () => {
  const wallState = replay('LDRDU');
  const boxState = replay('LDRDUURL');
  const checks: [GameState, GameState, Direction][] = [
    [wallState, { ...wallState, level: { ...wallState.level,
      walls: wallState.level.walls.filter(c => c.x !== 2 || c.y !== 0),
    } }, 'up'],
    [boxState, { ...boxState, blocks: boxState.blocks.map((b, i) => i === 1
      ? { ...b, position: { x: 0, y: 2 } } : b) }, 'left'],
  ];
  for (const [blocked, clear, direction] of checks) {
    expect(move(blocked, direction).events.some(e => e.type === 'goal-crossed')).toBe(true);
    expect(move(clear, direction).events.some(e => e.type === 'goal-pushed')).toBe(true);
  }
});

it('removes the box-blocked crossing requirement when an independent right route opens', () => {
  expect(withoutBoxCrossing(bb2GoalPermission.board.walls.filter(c => c.x !== 3 || c.y !== 2)))
    .toBe('solved');
});

it('has no dispensable initially empty floor cell in the compressed board', () => {
  for (const [x, y] of [[0, 0], [1, 0], [1, 1], [3, 1], [0, 2], [2, 3]]) {
    expect(solveLevel({ ...bb2GoalPermission, board: { ...bb2GoalPermission.board,
      walls: [...bb2GoalPermission.board.walls, { x: x!, y: y! }],
    } }, { maximumStates: 20000, maximumPlans: 1 }).status).toBe('proven-unsolved');
  }
});
