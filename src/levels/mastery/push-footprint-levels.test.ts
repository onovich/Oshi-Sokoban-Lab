import { describe, expect, it } from 'vitest';

import { analyzeLevelForAuthor } from '../../solver/author-analysis';
import { auditLevelMutations } from '../level-mutation-audit';
import { pushFootprintLevels } from './push-footprint-levels';

describe('P · push-side × footprint mastery arc', () => {
  it('starts with three compact, replayable theorem puzzles at D3–4', () => {
    expect(pushFootprintLevels).toHaveLength(6);
    expect(pushFootprintLevels.map((level) => level.difficulty.target)).toEqual([3, 3, 4, 4, 5, 5]);

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
    ]);
    expect(reports[0]!.bestPlan?.coreSignature).toMatch(/@2,1>3,1/);
    expect(reports[2]!.bestPlan?.coreSignature).toMatch(/@2,2>3,2/);
  });

  it('contains no unlabelled redundant board cell or mechanism', () => {
    for (const level of pushFootprintLevels) {
      const redundant = auditLevelMutations(level, 100_000)
        .filter((mutation) => mutation.classification === 'redundant');
      expect(redundant, level.id).toEqual([]);
    }
  });
});
