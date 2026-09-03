import { useMemo, useState } from 'react';

import type { LevelSpec } from '../course/types';
import { auditLevelMutations } from '../levels/level-mutation-audit';
import type { LevelMutationResult } from '../levels/level-mutation-audit';
import { analyzeLevelForAuthor } from '../solver/author-analysis';

type AuthorAnalysisPanelProps = Readonly<{
  spec: LevelSpec;
}>;

function mutationSummary(mutations: readonly LevelMutationResult[]): string {
  const counts = mutations.reduce((result, mutation) => ({
    ...result,
    [mutation.classification]: result[mutation.classification] + 1,
  }), { 'proof-critical': 0, readability: 0, redundant: 0 });
  return `证明关键 ${counts['proof-critical']} · 可读性 ${counts.readability} · 冗余 ${counts.redundant}`;
}

export function AuthorAnalysisPanel({ spec }: AuthorAnalysisPanelProps) {
  const analysis = useMemo(() => analyzeLevelForAuthor(spec, {
    maximumStates: 100_000,
    maximumPlans: 8,
    pushSlack: 2,
    moveSlack: 8,
  }), [spec]);
  const [mutations, setMutations] = useState<readonly LevelMutationResult[] | undefined>();
  const { diagnostics, metrics } = analysis.solution;

  return (
    <details aria-label="作者分析" className="author-analysis" role="region">
      <summary>
        <span>AUTHOR ANALYSIS</span>
        <strong>求解：{analysis.solution.status}</strong>
        <span>核心策略：{analysis.coreStrategy.status}</span>
      </summary>
      <div className="author-analysis__body">
        <dl>
          <div><dt>搜索</dt><dd>{analysis.solution.searchMode}</dd></div>
          <div><dt>最优</dt><dd>{analysis.solution.bestPlan ? `${analysis.solution.bestPlan.moves} 步 / ${analysis.solution.bestPlan.pushes} 推` : '—'}</dd></div>
          <div><dt>状态</dt><dd>{diagnostics.exploredStates}</dd></div>
          <div><dt>转置命中</dt><dd>{diagnostics.transpositionHits}</dd></div>
          <div><dt>死锁剪枝</dt><dd>{diagnostics.deadlockPrunes}</dd></div>
          <div><dt>分支点</dt><dd>{metrics.meaningfulBranchPoints}</dd></div>
          <div><dt>交互深度</dt><dd>{metrics.interactionDepth}</dd></div>
          <div><dt>区域变化</dt><dd>{metrics.reachableRegionChanges}</dd></div>
          <div><dt>顿悟尾巴</dt><dd>{analysis.solution.proof.insightTailPushes} 推</dd></div>
          <div><dt>宏策略</dt><dd>{analysis.coreStrategy.signatures.length}</dd></div>
        </dl>
        <section aria-label="证明条件" className="author-analysis__proofs">
          <h3>证明条件</h3>
          <ul>
            {analysis.proofChecks.map((check) => (
              <li data-proof-status={check.status} key={check.key}>
                <code>{check.key}</code><span>{check.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="变异审计" className="author-analysis__mutations">
          <h3>变异审计</h3>
          {mutations ? (
            <p>{mutationSummary(mutations)}</p>
          ) : (
            <button onClick={() => setMutations(auditLevelMutations(spec, 100_000))} type="button">
              运行删除 / 封墙变异
            </button>
          )}
        </section>
      </div>
    </details>
  );
}
