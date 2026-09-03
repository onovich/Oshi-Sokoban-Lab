import { describe, expect, it } from 'vitest';

import {
  acceptedFoundationCatalog,
  displayNumberFor,
  masteryV2Catalog,
} from './course-catalog';
import { MASTERY_V2_BLUEPRINT } from './mastery-blueprint';

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

  it('declares a five-act mastery catalog without making the draft the production default', () => {
    expect(masteryV2Catalog.id).toBe('mastery-v2');
    expect(masteryV2Catalog.status).toBe('draft');
    expect(masteryV2Catalog.targetFormalLevelCount).toBe(120);
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
});
