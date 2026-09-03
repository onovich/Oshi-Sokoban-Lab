import { describe, expect, it } from 'vitest';

import report from '../../research/16-course-solver-audit.md?raw';
import type { Direction } from '../engine/types';
import { courseLevels } from './course-catalog';
import { analyzeLevel } from './level-analyzer';
import { auditLevelMutations } from './level-mutation-audit';

const directionGlyph: Readonly<Record<Direction, string>> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
};

describe('checked-in course audit report', () => {
  it('matches the current solver metrics and replay route for all sixty-three lessons', () => {
    for (const level of courseLevels) {
      const result = analyzeLevel(level, 100_000);
      const number = level.id.slice(-2);
      const route = (result.solution ?? []).map((direction) => directionGlyph[direction]).join('');
      const row = [
        `| ${number}`,
        level.role,
        result.analysis.optimalMoves,
        result.analysis.optimalPushes,
        result.analysis.insightTailPushes,
        result.exploredStates,
        `${route} |`,
      ].join(' | ');

      expect(report, `${level.id} report row is stale`).toContain(row);
    }
  });

  it('matches the current mutation classification totals', () => {
    const classifications = courseLevels
      .flatMap((level) => auditLevelMutations(level, 100_000))
      .reduce((counts, mutation) => ({
        ...counts,
        [mutation.classification]: counts[mutation.classification] + 1,
      }), { 'proof-critical': 0, readability: 0, redundant: 0, inconclusive: 0 });
    const total = Object.values(classifications).reduce((sum, count) => sum + count, 0);

    expect(classifications.inconclusive).toBe(0);
    expect(report).toContain(`${total} 项变异全部重新求解`);
    expect(report).toContain(`${classifications['proof-critical']} 项改变可解性`);
    expect(report).toContain(`${classifications.readability} 项是显式标注的静态对照元素`);
    expect(report).toContain(`${classifications.redundant} 项未分类冗余`);
  });
});
