import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { bb1GoalWorkspace } from './bb1-goal-workspace';

const directions = { U: 'up', R: 'right', D: 'down', L: 'left' } as const;
function replay(route: string, board = bb1GoalWorkspace.board) {
  let state = createGame(board), crossings = 0;
  for (const letter of route) {
    const turn = move(state, directions[letter as keyof typeof directions]);
    expect(turn.didMove).toBe(true);
    crossings += turn.events.filter(event => event.type === 'goal-crossed').length;
    state = turn.state;
  }
  return { state, crossings };
}

it('requires moving the Goal beyond the first clearing position and recovering it', () => {
  const initial = createGame(bb1GoalWorkspace.board);
  expect(initial.blocks.every(block => !isBlockSolved(initial, block))).toBe(true);
  const options = { maximumStates: 80000, maximumPlans: 1, moveSlack: 0, pushSlack: 0 };
  const solved = solveLevel(bb1GoalWorkspace, options);
  expect(solved.status).toBe('solved');
  let state = initial;
  for (const direction of solved.bestPlan!.directions) {
    const turn = move(state, direction);
    expect(turn.didMove).toBe(true);
    state = turn.state;
  }
  expect(state.status).toBe('won');
  for (const condition of bb1GoalWorkspace.theorem.proofConditions) {
    expect(solveLevel(bb1GoalWorkspace, { ...options, forbiddenConditions: [condition] }).status)
      .toBe('proven-unsolved');
  }
});

it('allows equal-length crossing and walking strategies, not compulsory Goal crossing', () => {
  const crossed = replay('LLULDLRRUURD');
  const walked = replay('LLULLDRRUURD');
  expect(crossed.state.status).toBe('won');
  expect(walked.state.status).toBe('won');
  expect(crossed.crossings).toBe(1);
  expect(walked.crossings).toBe(0);
});

it('makes the tempting early Block push irrecoverable, while a side route removes Goal transport', () => {
  const spec = bb1GoalWorkspace;
  const early = replay('LU').state;
  expect(early.blocks[0]!.position).toEqual({ x: 3, y: 0 });
  expect(solveLevel({ ...spec, board: { ...spec.board,
    player: early.player, blocks: early.blocks, goals: early.goals,
  } }, { maximumStates: 80000, maximumPlans: 1 }).status).toBe('proven-unsolved');
  const side = { ...spec.board, walls: spec.board.walls.filter(cell => cell.x !== 4 || cell.y !== 3) };
  const result = replay('DLULUURD', side);
  expect(result.state.status).toBe('won');
  expect(result.state.goals[0]!.position).toEqual({ x: 3, y: 2 });
  expect(solveLevel({ ...spec, board: side }, {
    maximumStates: 80000, maximumPlans: 1,
    forbiddenConditions: [{ kind: 'event', event: { key: 'event:goal-pushed' } }],
  }).status).toBe('solved');
});
