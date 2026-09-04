import type { DifficultyAssessment } from '../course/types';

/** Developer-only evidence label; the caller keeps it out of the player interface. */
export function DifficultySummary({ difficulty }: { difficulty: DifficultyAssessment }) {
  if (difficulty.authorRating !== undefined) {
    return <p>作者 D{difficulty.authorRating} · 原目标 D{difficulty.target} · {
      difficulty.confidence === 'calibrated' ? '已完成陌生玩家校准' : '陌生玩家尚未校准'
    }</p>;
  }
  return <p>目标 D{difficulty.target} · {difficulty.confidence}</p>;
}
