import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog } from '../course/course-catalog';
import { analyzeLevelForAuthor } from './author-analysis';

describe('mastery author analysis', () => {
  it('reports proof necessity separately from an inconclusive search budget', () => {
    const spec = acceptedFoundationCatalog.levels[0]!;
    const complete = analyzeLevelForAuthor(spec, { maximumStates: 10_000 });
    const inconclusive = analyzeLevelForAuthor(spec, { maximumStates: 1 });

    expect(complete.solution.status).toBe('solved');
    expect(complete.proofChecks).toEqual([
      expect.objectContaining({ status: 'necessary', bypassExists: false }),
    ]);
    expect(complete.coreStrategy.status).toMatch(/unique|multiple/);
    expect(inconclusive.proofChecks[0]?.status).toBe('unknown');
  });

  it('exposes replayable alternative macro strategies and solver diagnostics', () => {
    const spec = acceptedFoundationCatalog.levels.find((level) => level.id === 'lesson-13')!;
    const analysis = analyzeLevelForAuthor(spec, {
      maximumStates: 100_000,
      maximumPlans: 8,
      pushSlack: 1,
    });

    expect(analysis.solution.bestPlan?.directions.length).toBeGreaterThan(0);
    expect(analysis.coreStrategy.signatures).toEqual(
      analysis.solution.plans.map((plan) => plan.coreSignature),
    );
    expect(analysis.solution.diagnostics.exploredStates).toBeGreaterThan(0);
  });
});
