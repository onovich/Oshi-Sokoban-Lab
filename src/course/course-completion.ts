import type { CourseCatalog } from './types';

export type CompletionTierProgress = Readonly<{
  achieved: boolean;
  completed: number;
  required: number;
}>;

export type CourseCompletionSummary = Readonly<{
  foundation: CompletionTierProgress;
  mainEnding: CompletionTierProgress;
  full: CompletionTierProgress;
}>;

function allRequiredProgress(
  requiredIds: readonly string[],
  completed: ReadonlySet<string>,
): CompletionTierProgress {
  const completedCount = requiredIds.filter((id) => completed.has(id)).length;
  return {
    achieved: requiredIds.length > 0 && completedCount === requiredIds.length,
    completed: completedCount,
    required: requiredIds.length,
  };
}

export function summarizeCourseCompletion(
  catalog: CourseCatalog,
  completedLevelIds: readonly string[],
): CourseCompletionSummary {
  const completed = new Set(completedLevelIds);
  const mainCompleted = catalog.completion.mainEndingLevelIds
    .filter((id) => completed.has(id)).length;
  const mainRequired = catalog.completion.mainEndingRequiredCount;
  return {
    foundation: allRequiredProgress(catalog.completion.foundationLevelIds, completed),
    mainEnding: {
      achieved: mainRequired > 0 && mainCompleted >= mainRequired,
      completed: mainCompleted,
      required: mainRequired,
    },
    full: allRequiredProgress(catalog.completion.fullCompletionLevelIds, completed),
  };
}
