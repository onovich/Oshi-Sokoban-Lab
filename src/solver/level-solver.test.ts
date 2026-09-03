import { describe, expect, it } from 'vitest';

import { proofConditionFromLegacy } from '../course/proof-condition';
import { acceptedFoundationCatalog } from '../course/course-catalog';
import type { LevelSpec } from '../course/types';
import { createGame, move } from '../engine/game-engine';
import type { Direction, LevelDefinition } from '../engine/types';
import { analyzeLevel } from '../levels/level-analyzer';
import { solveLevel } from './level-solver';

function replay(spec: LevelSpec, directions: readonly Direction[]): void {
  let state = createGame(spec.board);
  for (const direction of directions) {
    const result = move(state, direction);
    expect(result.didMove, `${spec.id}: ${direction} must remain effective`).toBe(true);
    state = result.state;
  }
  expect(state.status).toBe('won');
}

function deadlockSpec(): LevelSpec {
  const board: LevelDefinition = {
    id: 'solver-deadlock',
    title: '静态死锁',
    width: 3,
    height: 3,
    weather: 'clear',
    player: { x: 2, y: 2 },
    walls: [],
    terrainGoals: [{ x: 2, y: 0 }],
    terrainSpikes: [],
    blocks: [{
      id: 'solver-deadlock-block',
      position: { x: 0, y: 0 },
      shape: [{ x: 0, y: 0 }],
      number: 0,
      isFake: false,
    }],
    goals: [],
    gates: [],
    spikes: [],
    paths: [],
  };
  const proof = proofConditionFromLegacy('event:block-pushed:solver-deadlock-block');
  return {
    id: board.id,
    groupId: 'solver-fixtures',
    role: 'summit',
    cognitiveStage: 'synthesize',
    prerequisites: [],
    techniques: [{ techniqueId: 'deadlock', role: 'primary' }],
    difficulty: { target: 10, confidence: 'design-target', sampleSize: 0 },
    board,
    theorem: {
      axioms: ['Block 不能被拉出角落。'],
      proposition: '角落中的未完成 Block 已经死锁。',
      proofConditions: [proof],
      milestones: [proof],
    },
  };
}

describe('deep level solver interface', () => {
  it('distinguishes a depleted budget from a proof of unsolvability', () => {
    const spec = acceptedFoundationCatalog.levels[2]!;

    expect(solveLevel(spec, { maximumStates: 1 }).status).toBe('budget-exhausted');
    const deadlocked = solveLevel(deadlockSpec(), { maximumStates: 10_000 });
    expect(deadlocked.status).toBe('proven-unsolved');
    expect(deadlocked.diagnostics.deadlockPrunes).toBeGreaterThan(0);
  });

  it('uses push macros on a plain board and returns a replayable plan', () => {
    const spec = acceptedFoundationCatalog.levels[0]!;
    const report = solveLevel(spec);

    expect(report.status).toBe('solved');
    expect(report.searchMode).toBe('push-macro-a-star');
    expect(report.bestPlan?.actions.every((action) => action.kind === 'push')).toBe(true);
    expect(report.bestPlan?.moves).toBe(2);
    expect(report.bestPlan?.pushes).toBe(2);
    replay(spec, report.bestPlan?.directions ?? []);
  });

  it('classifies Gate, Rain and Spike inputs as domain actions while still replaying move()', () => {
    const ids = ['lesson-40', 'lesson-55', 'lesson-22'] as const;
    const expectedKinds = ['gate-traverse', 'rain-slide', 'object-reset'] as const;

    ids.forEach((id, index) => {
      const spec = acceptedFoundationCatalog.levels.find((level) => level.id === id)!;
      const report = solveLevel(spec);
      expect(report.status, id).toBe('solved');
      expect(report.bestPlan?.actions.some((action) => action.kinds.includes(expectedKinds[index])), id)
        .toBe(true);
      replay(spec, report.bestPlan?.directions ?? []);
    });
  });

  it('agrees with the bounded BFS oracle on all sixty frozen lessons', () => {
    for (const spec of acceptedFoundationCatalog.levels) {
      const oracle = analyzeLevel(spec, 100_000);
      const report = solveLevel(spec, { maximumStates: 100_000 });

      expect(report.status, spec.id).toBe('solved');
      expect(report.bestPlan?.moves, spec.id).toBe(oracle.analysis.optimalMoves);
      expect(report.bestPlan?.pushes, spec.id).toBe(oracle.analysis.optimalPushes);
      replay(spec, report.bestPlan?.directions ?? []);
    }
  }, 120_000);

  it('returns distinct macro signatures and authoring metrics instead of one opaque route', () => {
    const spec = acceptedFoundationCatalog.levels.find((level) => level.id === 'lesson-13')!;
    const report = solveLevel(spec, { pushSlack: 1, maximumPlans: 8 });

    expect(report.plans.length).toBeGreaterThan(0);
    expect(new Set(report.plans.map((plan) => plan.coreSignature)).size).toBe(report.plans.length);
    expect(report.metrics).toEqual(expect.objectContaining({
      firstIrreversibleAction: expect.any(Number),
      meaningfulBranchPoints: expect.any(Number),
      interactionDepth: expect.any(Number),
      reachableRegionChanges: expect.any(Number),
    }));
  });
});
