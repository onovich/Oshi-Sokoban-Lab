import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { rs01RainStaging } from './rs01-rain-staging';
import { auditLevelMutations } from '../level-mutation-audit';

it('requires temporary deep staging and retrieval before completing the Rain board', () => {
  const options = { maximumStates: 80000, maximumPlans: 1 };
  const report = solveLevel(rs01RainStaging, options);
  expect(report.status).toBe('solved');
  let state = createGame(rs01RainStaging.board);
  for (const direction of report.bestPlan!.directions) {
    const result = move(state, direction);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  expect(state.status).toBe('won');
  for (const condition of rs01RainStaging.theorem.proofConditions) {
    expect(solveLevel(rs01RainStaging, { ...options, forbiddenConditions: [condition] }).status)
      .toBe('proven-unsolved');
  }
});

it('has no unexplained spare floor or objects after compacting the candidate', () => {
  const audit = auditLevelMutations(rs01RainStaging, 80000);
  expect(audit.filter(row => row.classification === 'redundant')).toEqual([]);
  expect(audit.filter(row => ['invalid', 'inconclusive'].includes(row.effect))).toEqual([]);
}, 30000);

it('removes each staging constraint when walking replaces sliding and keeps the causal tail short', () => {
  for (const condition of rs01RainStaging.theorem.proofConditions) {
    const dry = solveLevel({ ...rs01RainStaging,
      board: { ...rs01RainStaging.board, weather: 'clear' } }, {
      maximumStates: 80000, maximumPlans: 1, forbiddenConditions: [condition],
    });
    expect(dry.status).toBe('solved');
    let state = createGame({ ...rs01RainStaging.board, weather: 'clear' });
    for (const direction of dry.bestPlan!.directions) state = move(state, direction).state;
    expect(state.status).toBe('won');
  }
  const report = solveLevel(rs01RainStaging, { maximumStates: 80000, maximumPlans: 1 });
  expect(report.proof.milestones.every(row => row.satisfied)).toBe(true);
  expect(report.proof.insightTailPushes).toBeLessThanOrEqual(6);
});

it('uses the small block and the completed long block as distinct Rain stopping boundaries', () => {
  let state = createGame(rs01RainStaging.board);
  const prefix = ['up', 'left', 'down', 'down', 'right', 'down', 'right', 'up', 'up', 'left', 'up'] as const;
  for (const direction of prefix) state = move(state, direction).state;
  expect(state.player).toEqual({ x: 0, y: 1 });
  expect(move(state, 'right').state.player).toEqual({ x: 2, y: 1 });
  // Local causal intervention, not claimed to be a reachable alternative puzzle state.
  const withoutSmallBlock = { ...state, blocks: state.blocks.filter(block => !block.id.endsWith('-c')) };
  expect(move(withoutSmallBlock, 'right').state.player).toEqual({ x: 3, y: 1 });
});
