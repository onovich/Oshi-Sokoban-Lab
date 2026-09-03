import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog, masteryV2Catalog } from './course-catalog';
import { summarizeCourseCompletion } from './course-completion';

describe('layered course completion', () => {
  it('awards foundation graduation only after every D1–6 course slot is complete', () => {
    const ids = masteryV2Catalog.completion.foundationLevelIds;
    const before = summarizeCourseCompletion(masteryV2Catalog, ids.slice(0, -1));
    const after = summarizeCourseCompletion(masteryV2Catalog, ids);

    expect(before.foundation.achieved).toBe(false);
    expect(after.foundation).toEqual({ achieved: true, completed: ids.length, required: ids.length });
  });

  it('awards the main ending after any three declared D8 endpoints', () => {
    const endpoints = masteryV2Catalog.completion.mainEndingLevelIds;
    expect(summarizeCourseCompletion(masteryV2Catalog, endpoints.slice(0, 2)).mainEnding.achieved)
      .toBe(false);
    expect(summarizeCourseCompletion(masteryV2Catalog, endpoints.slice(0, 3)).mainEnding)
      .toEqual({ achieved: true, completed: 3, required: 3 });
  });

  it('reserves 100% completion for every formal slot and keeps the old course independent', () => {
    const allMasteryIds = masteryV2Catalog.completion.fullCompletionLevelIds;
    expect(summarizeCourseCompletion(masteryV2Catalog, allMasteryIds.slice(0, -1)).full.achieved)
      .toBe(false);
    expect(summarizeCourseCompletion(masteryV2Catalog, allMasteryIds).full.achieved).toBe(true);
    expect(summarizeCourseCompletion(
      acceptedFoundationCatalog,
      acceptedFoundationCatalog.levels.map((level) => level.id),
    ).full.achieved).toBe(true);
  });
});
