import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { gr01RainLanding } from './gr01-rain-landing';
import { auditLevelMutations } from '../level-mutation-audit';

it('solves the Rain relative while requiring the Goal landing preparation and box detour', () => {
  const report = solveLevel(gr01RainLanding, { maximumStates: 80000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(gr01RainLanding.board);
  for (const direction of report.bestPlan!.directions) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.status).toBe('won');
  for (const condition of gr01RainLanding.theorem.proofConditions) {
    expect(solveLevel(gr01RainLanding, { maximumStates: 80000, maximumPlans: 1,
      forbiddenConditions: [condition] }).status).toBe('proven-unsolved');
  }
});

it('uses the relocated Goal as the landing boundary for the sideways approach', () => {
  let state = createGame(gr01RainLanding.board);
  state = move(state, 'up').state;
  expect(state.player).toEqual({ x: 0, y: 0 });
  expect(move(state, 'down').state.player).toEqual({ x: 0, y: 2 });
  for (const direction of ['right', 'down', 'left', 'right', 'up', 'left'] as const) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.player).toEqual({ x: 0, y: 0 });
  expect(state.goals[0]!.position).toEqual({ x: 0, y: 2 });
  const landing = move(state, 'down').state;
  expect(landing.player).toEqual({ x: 0, y: 1 });
  expect(move(landing, 'right').state.blocks[0]!.position).toEqual({ x: 2, y: 1 });
});

it('removes the detour requirement with a stopping wall or with walking instead of sliding', () => {
  const controls = [
    { ...gr01RainLanding.board, walls: [...gr01RainLanding.board.walls, { x: 2, y: 0 }] },
    { ...gr01RainLanding.board, weather: 'clear' as const },
  ];
  for (const board of controls) {
    const report = solveLevel({ ...gr01RainLanding, board }, {
      maximumStates: 80000, maximumPlans: 1,
      forbiddenConditions: gr01RainLanding.theorem.proofConditions,
    });
    expect(report.status).toBe('solved');
    expect(report.bestPlan!.pushes).toBe(1);
  }
});

it('accounts for the candidate cells and bounds its execution-tail witness', () => {
  const audit = auditLevelMutations(gr01RainLanding, 80000);
  expect(audit.filter(row => row.classification === 'redundant')).toEqual([]);
  expect(audit.filter(row => ['invalid', 'inconclusive'].includes(row.effect))).toEqual([]);
  const report = solveLevel(gr01RainLanding, { maximumStates: 80000, maximumPlans: 1 });
  expect(report.proof.milestones.every(row => row.satisfied)).toBe(true);
  expect(report.proof.insightTailPushes).toBeLessThanOrEqual(6);
});
