import { describe, expect, it } from 'vitest';

import { analyzeLevelForAuthor } from '../../solver/author-analysis';
import { auditLevelMutations } from '../level-mutation-audit';
import { pushFootprintLevels } from './push-footprint-levels';

describe('P · push-side × footprint mastery arc', () => {
  it('builds the first ten compact, replayable theorem puzzles across D3–8', () => {
    expect(pushFootprintLevels).toHaveLength(10);
    expect(pushFootprintLevels.map((level) => level.difficulty.target)).toEqual([
      3, 3, 4, 4, 5, 5, 6, 6, 7, 8,
    ]);

    for (const level of pushFootprintLevels) {
      const analysis = analyzeLevelForAuthor(level, { maximumStates: 100_000 });
      expect(analysis.solution.status, level.id).toBe('solved');
      expect(analysis.solution.proof.required.every((proof) => proof.satisfied), level.id).toBe(true);
      expect(analysis.proofChecks.every((check) => check.status === 'necessary'), level.id).toBe(true);
    }
  });

  it('uses the intended push macro in each opening puzzle', () => {
    const reports = pushFootprintLevels.map((level) =>
      analyzeLevelForAuthor(level, { maximumStates: 100_000 }).solution);

    expect(reports.map((report) => [report.bestPlan?.moves, report.bestPlan?.pushes])).toEqual([
      [7, 3],
      [5, 2],
      [7, 3],
      [9, 3],
      [4, 3],
      [14, 2],
      [14, 2],
      [13, 3],
      [15, 2],
      [13, 4],
    ]);
    expect(reports[0]!.bestPlan?.coreSignature).toMatch(/@2,1>3,1/);
    expect(reports[2]!.bestPlan?.coreSignature).toMatch(/@2,2>3,2/);
  });

  it('keeps the D7–8 candidates within a unique near-optimal macro strategy and short insight tail', () => {
    for (const level of pushFootprintLevels.slice(8)) {
      const analysis = analyzeLevelForAuthor(level, {
        maximumStates: 500_000,
        maximumPlans: 8,
        pushSlack: 1,
        moveSlack: 6,
      });
      expect(analysis.coreStrategy.status, level.id).toBe('unique');
      expect(analysis.solution.proof.insightTailPushes, level.id).toBeLessThanOrEqual(6);
    }
  });

  it('contains no unlabelled redundant board cell or mechanism', () => {
    for (const level of pushFootprintLevels) {
      const redundant = auditLevelMutations(level, 100_000)
        .filter((mutation) => mutation.classification === 'redundant');
      expect(redundant, level.id).toEqual([]);
    }
  });
});
