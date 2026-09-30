import { ACCEPTED_LEVEL_FREEZE_MANIFEST, frozenLevelHash } from './accepted-freeze';
import { LABORATORY_FREEZE_MANIFEST } from './lab-freeze';
import type { LevelSpec } from './types';

export type AcceptanceRecord = Readonly<{
  levelId: string;
  hash: string;
  reviewer: 'ai' | 'author';
  verdict: 'passed' | 'changes-requested';
  evidence: string;
}>;

export type AcceptanceState = 'pending' | 'ai-passed' | 'ai-changes' | 'author-passed' | 'author-changes' | 'outdated';
export const acceptanceLabels: Readonly<Record<AcceptanceState, string>> = {
  pending: '待验收',
  'ai-passed': 'AI 初审通过 · 待作者验收',
  'ai-changes': 'AI 初审待改进',
  'author-passed': '作者验收通过 · 最终',
  'author-changes': '作者退回 · 待改进',
  outdated: '盘面已变更 · 待重新验收',
};

// Chronological ledger. Preservation and a difficulty score alone are not approval.
export const levelAcceptanceRecords: readonly AcceptanceRecord[] = [
  { levelId: 'lab-h2-clearance', hash: '2c1c9d44', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-ai-h2.md' },
  { levelId: 'lab-h1-detour', hash: '0fdb0e02', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-ai-h1.md' },
  { levelId: 'lab-bd3-controlled-entry', hash: '7f737953', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-ai-bd3.md' },
  { levelId: 'lab-be1-origin-loan', hash: '18b8b870', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-ai-be1.md' },
  { levelId: 'lab-bb2-goal-permission', hash: '60603a18', reviewer: 'ai', verdict: 'changes-requested',
    evidence: 'docs/playtests/2026-09-30-ai-bb2.md' },
  { levelId: 'lab-bb2-goal-permission', hash: '60603a18', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-goal-overlap.md' },
  { levelId: 'lab-bd2-shifted-entry', hash: '715697b1', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-29-ai-bd2.md' },
  { levelId: 'lab-bd1-direction-choice', hash: '967598e0', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-29-ai-bd1.md' },
  { levelId: 'lab-bb1-goal-workspace', hash: 'eed647f4', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-29-ai-bb1.md' },
  { levelId: 'lab-bc2-borrowed-stop', hash: '539467ca', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-29-ai-bc2.md' },
  { levelId: 'lab-ba3-two-stage-parking', hash: 'af8bcc97', reviewer: 'ai', verdict: 'changes-requested',
    evidence: 'docs/playtests/2026-09-29-ai-ba3.md' },
  { levelId: 'lab-ba3-two-stage-parking', hash: 'd51b5eea', reviewer: 'ai', verdict: 'changes-requested',
    evidence: 'docs/playtests/2026-09-29-ai-ba3.md' },
  { levelId: 'lab-ba3-two-stage-parking', hash: 'd51b5eea', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-return-visual-review.md' },
  { levelId: 'lab-bc1-offset-bank', hash: '2555afe4', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-29-ai-bc1.md' },
  { levelId: 'lab-ba2-shared-bay', hash: '330d3b95', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-29-ai-ba2.md' },
  { levelId: 'lab-ba1-return-passage', hash: '6065d08c', reviewer: 'ai', verdict: 'changes-requested',
    evidence: 'docs/playtests/2026-09-29-ai-ba1.md' },
  { levelId: 'lab-ba1-return-passage', hash: '6065d08c', reviewer: 'ai', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-30-return-visual-review.md' },
  { levelId: 'lab-gc01-goal-return', hash: 'a329d43a', reviewer: 'author', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-08-goal-reverse-transfer.md' },
  { levelId: 'lab-gc03-goal-handoff', hash: '5748c5bb', reviewer: 'author', verdict: 'passed',
    evidence: 'docs/playtests/2026-09-08-goal-reverse-transfer.md' },
  ...Object.entries(ACCEPTED_LEVEL_FREEZE_MANIFEST).map(([levelId, hash]) => ({
    levelId, hash, reviewer: 'author' as const, verdict: 'passed' as const,
    evidence: 'docs/high-difficulty/level-library.md#总量与边界',
  })),
  ...[
    'lab-e06-small-court', 'lab-e06-independent-return', 'lab-e06-interleaved',
    'lab-e02-return-door', 'lab-e02-return-reservation', 'lab-e02-return-loan',
    'lab-e04-upper-route', 'lab-e04-middle-court', 'lab-e04-shared-court',
  ].map(levelId => ({
    levelId, hash: LABORATORY_FREEZE_MANIFEST[levelId]!,
    reviewer: 'author' as const, verdict: 'passed' as const,
    evidence: 'docs/high-difficulty/level-library.md#推荐浏览顺序',
  })),
];

/** Latest author decision wins even over a later AI pass. Revised content needs review again. */
export function levelAcceptance(spec: LevelSpec, records = levelAcceptanceRecords): Readonly<{
  state: AcceptanceState;
  label: string;
  evidence?: string;
}> {
  const history = records.filter(record => record.levelId === spec.id);
  const current = history.filter(record => record.hash === frozenLevelHash(spec));
  const author = current.filter(record => record.reviewer === 'author').at(-1);
  const decision = author ?? current.at(-1);
  const state: AcceptanceState = decision
    ? decision.reviewer === 'author'
      ? decision.verdict === 'passed' ? 'author-passed' : 'author-changes'
      : decision.verdict === 'passed' ? 'ai-passed' : 'ai-changes'
    : history.length ? 'outdated' : 'pending';
  return { state, label: acceptanceLabels[state], evidence: decision?.evidence };
}
