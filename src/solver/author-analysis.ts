import { proofConditionKey } from '../course/proof-condition';
import type { LevelSpec, ProofCondition, SearchStatus } from '../course/types';
import { solveLevel } from './level-solver';
import type { SolverOptions, SolverReport } from './level-solver';

export type ProofNecessityStatus = 'necessary' | 'bypass' | 'unknown';

export type ProofNecessityCheck = Readonly<{
  condition: ProofCondition;
  key: string;
  status: ProofNecessityStatus;
  bypassExists: boolean | undefined;
  counterfactualSearchStatus: SearchStatus;
}>;

export type AuthorLevelAnalysis = Readonly<{
  solution: SolverReport;
  proofChecks: readonly ProofNecessityCheck[];
  coreStrategy: Readonly<{
    status: 'unique' | 'multiple' | 'unknown';
    signatures: readonly string[];
  }>;
}>;

function necessityStatus(
  solutionStatus: SearchStatus,
  counterfactualStatus: SearchStatus,
): ProofNecessityStatus {
  if (solutionStatus !== 'solved' || counterfactualStatus === 'budget-exhausted') return 'unknown';
  return counterfactualStatus === 'solved' ? 'bypass' : 'necessary';
}

/**
 * Runs the expensive author-only questions around the shared move()-driven
 * solver. A depleted budget always stays explicit: it is never interpreted as
 * proof that a bypass does not exist.
 */
export function analyzeLevelForAuthor(
  spec: LevelSpec,
  options: SolverOptions = {},
): AuthorLevelAnalysis {
  const solution = solveLevel(spec, options);
  const proofChecks = spec.theorem.proofConditions.map((condition): ProofNecessityCheck => {
    const counterfactual = solveLevel(spec, {
      ...options,
      forbiddenConditions: [condition],
      maximumPlans: 1,
    });
    const status = necessityStatus(solution.status, counterfactual.status);
    return {
      condition,
      key: proofConditionKey(condition),
      status,
      bypassExists: status === 'unknown' ? undefined : status === 'bypass',
      counterfactualSearchStatus: counterfactual.status,
    };
  });
  const signatures = solution.plans.map((plan) => plan.coreSignature);
  const coreStatus = !solution.diagnostics.completePlanWindow || solution.status !== 'solved'
    ? 'unknown'
    : signatures.length > 1
      ? 'multiple'
      : 'unique';

  return {
    solution,
    proofChecks,
    coreStrategy: { status: coreStatus, signatures },
  };
}
