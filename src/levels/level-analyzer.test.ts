import { describe, expect, it } from 'vitest';

import type { LevelSpec } from '../engine/types';
import { courseLevels } from './course-catalog';
import { occupancyLevels } from './families/occupancy-levels';
import { analyzeLevel } from './level-analyzer';

describe('public level analyzer', () => {
  it('finds an optimal route and proves a required push cannot be bypassed', () => {
    const board = occupancyLevels[0]!;
    const spec: LevelSpec = {
      id: board.id,
      groupId: 'analyzer-fixture',
      role: 'establish',
      prerequisites: [],
      board,
      theorem: {
        axioms: ['多格 Block 作为一个整体移动。'],
        proposition: '必须推动这件 Block。',
        requiredPredicates: ['event:block-pushed:occupancy-guide-domino'],
        criticalEvent: 'event:block-pushed:occupancy-guide-domino',
      },
    };

    const result = analyzeLevel(spec);

    expect(result.analysis).toMatchObject({
      solvable: true,
      optimalMoves: 2,
      optimalPushes: 2,
      insightTailPushes: 1,
      bypassExists: false,
    });
    expect(result.solution).toEqual(['right', 'right']);
  });

  it('tracks an event-count predicate across multiple moves', () => {
    const board = occupancyLevels[0]!;
    const predicate = 'event-count:2:event:block-pushed:occupancy-guide-domino';
    const spec: LevelSpec = {
      id: board.id,
      groupId: 'analyzer-count-fixture',
      role: 'establish',
      prerequisites: [],
      board,
      theorem: {
        axioms: ['多格 Block 作为一个整体移动。'],
        proposition: '这件 Block 必须连续完成两次推动。',
        requiredPredicates: [predicate],
        criticalEvent: predicate,
      },
    };

    const result = analyzeLevel(spec);

    expect(result.analysis.bypassExists).toBe(false);
    expect(result.analysis.insightTailPushes).toBe(0);
  });

  it('tracks an ordered event sequence without requiring adjacent turns', () => {
    const base = courseLevels.find((level) => level.id === 'lesson-30')!;
    const predicate = [
      'event-sequence:',
      'event:goal-pushed:lesson-30-goal',
      '>',
      'event:goal-crossed:lesson-30-goal',
    ].join('');
    const spec: LevelSpec = {
      ...base,
      theorem: {
        ...base.theorem,
        requiredPredicates: [predicate],
        criticalEvent: predicate,
      },
    };

    const result = analyzeLevel(spec);

    expect(result.analysis.solvable).toBe(true);
    expect(result.analysis.bypassExists).toBe(false);
    expect(result.analysis.insightTailPushes).toBe(1);
  });

  it('can name an exact movement transition as the critical event', () => {
    const board = occupancyLevels[0]!;
    const predicate = 'event:block-pushed:occupancy-guide-domino:from:2,1:to:3,1';
    const spec: LevelSpec = {
      id: board.id,
      groupId: 'analyzer-transition-fixture',
      role: 'boundary',
      prerequisites: [],
      board,
      theorem: {
        axioms: ['Block 每次平移一格。'],
        proposition: '必须完成指定落位。',
        requiredPredicates: [predicate],
        criticalEvent: predicate,
      },
    };

    const result = analyzeLevel(spec);

    expect(result.analysis.bypassExists).toBe(false);
    expect(result.analysis.insightTailPushes).toBe(0);
  });
});
