import { describe, expect, it } from 'vitest';

import {
  acceptedFoundationCatalog,
  displayNumberFor,
  masteryV2Catalog,
} from './course-catalog';
import { MASTERY_V2_BLUEPRINT } from './mastery-blueprint';
import { getNextCourseLevelId, getUnlockedCourseLevelIds } from '../levels/course-progress';

describe('versioned course catalogs', () => {
  it('separates the sixty accepted lessons from the three Spike laboratory prototypes', () => {
    expect(acceptedFoundationCatalog.levels).toHaveLength(60);
    expect(acceptedFoundationCatalog.labLevels.map((level) => level.id)).toEqual([
      'lab-spike-clear',
      'lab-spike-rebirth',
      'lab-spike-progress',
    ]);
    expect(acceptedFoundationCatalog.levels.some((level) =>
      level.id.startsWith('lab-') || ['lesson-19', 'lesson-20', 'lesson-21'].includes(level.id),
    )).toBe(false);
  });

  it('derives display position without rewriting a stable lesson id', () => {
    expect(displayNumberFor(acceptedFoundationCatalog, 'lesson-18')).toBe(18);
    expect(displayNumberFor(acceptedFoundationCatalog, 'lesson-22')).toBe(19);
    expect(acceptedFoundationCatalog.levels.find((level) => level.id === 'lesson-22')?.board.id)
      .toBe('lesson-22');
  });

  it('adds E01 only to the draft laboratory, never to formal slots or the accepted catalog', () => {
    const experimentIds = ['lab-e01-shared-passage', 'lab-e01-independent-passage'];
    expect(masteryV2Catalog.labLevels.filter((level) => level.groupId === 'lab-e01-spatial')
      .map((level) => level.id)).toEqual(experimentIds);
    expect(masteryV2Catalog.labGroups.find((group) => group.id === 'lab-e01-spatial')?.levelIds)
      .toEqual(experimentIds);
    for (const id of experimentIds) {
      expect(displayNumberFor(masteryV2Catalog, id)).toBeUndefined();
      expect(masteryV2Catalog.levels.some((level) => level.id === id)).toBe(false);
      expect(acceptedFoundationCatalog.labLevels.some((level) => level.id === id)).toBe(false);
      expect(masteryV2Catalog.completion.fullCompletionLevelIds).not.toContain(id);
    }
  });

  it('preserves mastery blueprint display slots while planned levels are absent', () => {
    expect(displayNumberFor(masteryV2Catalog, 'mastery-push-footprint-01')).toBe(31);
    expect(displayNumberFor(masteryV2Catalog, 'lesson-22')).toBe(70);
    expect(displayNumberFor(masteryV2Catalog, 'lesson-27')).toBe(75);
  });

  it('declares a five-act mastery catalog without making the draft the production default', () => {
    expect(masteryV2Catalog.id).toBe('mastery-v2');
    expect(masteryV2Catalog.status).toBe('draft');
    expect(masteryV2Catalog.targetFormalLevelCount).toBe(120);
    expect(masteryV2Catalog.formalLevelOrder).toHaveLength(120);
    expect(masteryV2Catalog.completion.fullCompletionLevelIds)
      .toEqual(masteryV2Catalog.formalLevelOrder);
    expect(masteryV2Catalog.acts.map((act) => act.id)).toEqual([
      'act-1-grammar',
      'act-2-fluency',
      'act-3-reinterpretation',
      'act-4-synthesis',
      'act-5-summit',
    ]);
    expect(masteryV2Catalog.levels).toHaveLength(70);
    expect(masteryV2Catalog.groups.find((group) => group.id === 'mastery-push-footprint-opening')?.levelIds)
      .toEqual([
        'mastery-push-footprint-01',
        'mastery-push-footprint-02',
        'mastery-push-footprint-03',
      ]);
    expect(masteryV2Catalog.acts.find((act) => act.id === 'act-2-fluency')?.levelIds)
      .toContain('mastery-push-footprint-06');
    expect(masteryV2Catalog.levels.map((level) => level.id)).toEqual(
      MASTERY_V2_BLUEPRINT.slots
        .filter((slot) => slot.state !== 'planned')
        .map((slot) => slot.levelId),
    );
  });

  it('orders navigation groups by their first playable blueprint slot', () => {
    const displayIndex = new Map(
      masteryV2Catalog.levels.map((level, index) => [level.id, index]),
    );
    const groupStarts = masteryV2Catalog.groups.map((group) => Math.min(
      ...group.levelIds.map((levelId) => displayIndex.get(levelId) ?? Number.POSITIVE_INFINITY),
    ));

    expect(groupStarts).toEqual([...groupStarts].sort((left, right) => left - right));
  });

  it('routes the end of act I to the first playable act II mastery slot', () => {
    const completedActOne = masteryV2Catalog.levels
      .filter((level) => (displayNumberFor(masteryV2Catalog, level.id) ?? 121) <= 30)
      .map((level) => level.id);

    expect(getNextCourseLevelId(
      masteryV2Catalog.groups,
      'lesson-33',
      completedActOne,
    )).toBe('mastery-push-footprint-01');
  });

  it('keeps the slot-70 Spike reveal behind the final hazard-only bridge', () => {
    const beforeReveal = masteryV2Catalog.levels
      .map((level) => level.id)
      .filter((levelId) => !['lesson-22', 'lesson-23', 'lesson-24'].includes(levelId));

    expect(getUnlockedCourseLevelIds(masteryV2Catalog.groups, beforeReveal).has('lesson-22'))
      .toBe(false);
    expect(getUnlockedCourseLevelIds(
      masteryV2Catalog.groups,
      [...beforeReveal, 'mastery-spike-bridge-08'],
    ).has('lesson-22')).toBe(true);
  });
});
