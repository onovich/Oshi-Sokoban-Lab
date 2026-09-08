import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move, undo } from '../../engine/game-engine';
import type { Direction, GameState } from '../../engine/types';
import { solveLevel } from '../../solver/level-solver';
import { auditLevelMutations } from '../level-mutation-audit';
import { gc01GoalReturn } from './gc01-goal-return';

it('replays the Goal coordination candidate through the real rules without bypassing either preparation', () => {
  const report = solveLevel(gc01GoalReturn, { maximumStates: 80000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(gc01GoalReturn.board);
  expect(state.status).toBe('playing');
  for (const direction of report.bestPlan!.directions) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.status).toBe('won');
  expect(report.proof.milestones.every(milestone => milestone.satisfied)).toBe(true);
  expect(report.proof.insightTailPushes).toBeLessThanOrEqual(6);
  for (const condition of gc01GoalReturn.theorem.proofConditions) {
    expect(solveLevel(gc01GoalReturn, {
      maximumStates: 80000, maximumPlans: 1, forbiddenConditions: [condition],
    }).status).toBe('proven-unsolved');
  }
});

function continuation(state: GameState) {
  // No origin-dependent mechanisms in this candidate; rehydrate this exact layout.
  return solveLevel({ ...gc01GoalReturn, board: {
    ...state.level, player: state.player, blocks: state.blocks, goals: state.goals,
  } }, { maximumStates: 80000, maximumPlans: 1 });
}

it('exposes the tempting early finish as a lost return route, not an unknown rule', () => {
  const route: Direction[] = ['right', 'right', 'left', 'left', 'up', 'up', 'right', 'right',
    'down', 'right', 'right', 'down', 'down', 'left', 'up', 'left', 'left'];
  let state = createGame(gc01GoalReturn.board);
  for (const direction of route) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.blocks[1]!.position).toEqual({ x: 0, y: 2 });
  expect(isBlockSolved(state, state.blocks[1]!)).toBe(true);
  expect(state.status).toBe('playing');
  expect(continuation(state).status).toBe('proven-unsolved');
  expect(continuation(undo(state)).status).toBe('solved');
  const independentReturn = {
    ...state, level: { ...state.level, walls: state.level.walls.filter(cell => cell.x !== 1 || cell.y !== 1) },
  };
  expect(continuation(independentReturn).status).toBe('solved');
});

it('removes the target-relocation requirement when an independent return route is added', () => {
  const control = { ...gc01GoalReturn, board: {
    ...gc01GoalReturn.board,
    walls: gc01GoalReturn.board.walls.filter(cell => cell.x !== 1 || cell.y !== 1),
  } };
  expect(solveLevel(control, {
    maximumStates: 80000, maximumPlans: 1,
    forbiddenConditions: [gc01GoalReturn.theorem.proofConditions[0]!],
  }).status).toBe('solved');
});

it('accounts for every tested element without hiding redundant cells in readability labels', () => {
  const report = auditLevelMutations(gc01GoalReturn, 80000);
  expect(report.filter(result => result.classification === 'redundant')).toEqual([]);
  expect(report.filter(result => ['invalid', 'inconclusive'].includes(result.effect))).toEqual([]);
});
