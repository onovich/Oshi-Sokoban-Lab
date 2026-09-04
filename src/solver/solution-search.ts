import type { LevelSpec } from '../course/types';
import { solveLevel } from './level-solver';
import type { SolutionResult } from './solution-request';

/** Find a valid witness, without running author-only counterfactual analyses. */
export function findDemoSolution(spec: LevelSpec): SolutionResult {
  const report = solveLevel(spec, {
    maximumStates: 200_000,
    maximumPlans: 1,
    moveSlack: 0,
    pushSlack: 0,
  });
  return report.bestPlan
    ? { status: 'solved', directions: report.bestPlan.directions }
    : { status: report.status === 'proven-unsolved' ? 'proven-unsolved' : 'budget-exhausted' };
}
