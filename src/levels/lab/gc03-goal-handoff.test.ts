import { expect, it } from 'vitest';
import { createGame, move, undo } from '../../engine/game-engine';
import type { Direction, GameState } from '../../engine/types';
import { solveLevel } from '../../solver/level-solver';
import { gc03GoalHandoff } from './gc03-goal-handoff';
import { auditLevelMutations } from '../level-mutation-audit';

it('requires both Goal transport and reopening the completed box while remaining solvable', () => {
  const report = solveLevel(gc03GoalHandoff, { maximumStates: 80000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(gc03GoalHandoff.board);
  for (const direction of report.bestPlan!.directions) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.status).toBe('won');
  for (const condition of gc03GoalHandoff.theorem.proofConditions) {
    expect(solveLevel(gc03GoalHandoff, { maximumStates: 80000, maximumPlans: 1,
      forbiddenConditions: [condition] }).status).toBe('proven-unsolved');
  }
});

function continuation(state: GameState) {
  return solveLevel({ ...gc03GoalHandoff, board: { ...state.level,
    player: state.player, blocks: state.blocks, goals: state.goals,
  } }, { maximumStates: 80000, maximumPlans: 1 });
}

it('makes early descent lose the Goal return slot, but Undo and an independent entry recover it', () => {
  let state = createGame(gc03GoalHandoff.board);
  const route: Direction[] = ['right', 'right', 'up', 'up', 'left', 'down'];
  for (const direction of route) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.blocks[0]!.position).toEqual({ x: 1, y: 2 });
  expect(state.goals[0]!.position).toEqual({ x: 2, y: 2 });
  expect(continuation(state).status).toBe('proven-unsolved');
  expect(continuation(undo(state)).status).toBe('solved');
  const control = { ...gc03GoalHandoff, board: { ...gc03GoalHandoff.board,
    walls: gc03GoalHandoff.board.walls.filter(p => !(p.x === 0 && p.y <= 1)),
  } };
  expect(solveLevel(control, { maximumStates: 80000, maximumPlans: 1,
    forbiddenConditions: gc03GoalHandoff.theorem.proofConditions }).status).toBe('solved');
});

it('has no unexplained spare cells in the transfer layout', () => {
  const audit = auditLevelMutations(gc03GoalHandoff, 80000);
  expect(audit.filter(row => row.classification === 'redundant')).toEqual([]);
  expect(audit.filter(row => ['invalid', 'inconclusive'].includes(row.effect))).toEqual([]);
});
