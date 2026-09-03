import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog } from './course-catalog';
import { MASTERY_V2_BLUEPRINT } from './mastery-blueprint';

describe('mastery-v2 120-slot blueprint', () => {
  it('pins the five-act allocation and keeps every frozen lesson exactly once', () => {
    expect(MASTERY_V2_BLUEPRINT.slots).toHaveLength(120);
    expect(MASTERY_V2_BLUEPRINT.acts.map((act) => act.slots.length)).toEqual([30, 30, 29, 24, 7]);

    const frozenIds = MASTERY_V2_BLUEPRINT.slots
      .filter((slot) => slot.source === 'frozen')
      .map((slot) => slot.levelId);
    expect(frozenIds).toHaveLength(60);
    expect(new Set(frozenIds)).toEqual(new Set(acceptedFoundationCatalog.levels.map((level) => level.id)));
    expect(MASTERY_V2_BLUEPRINT.slots.some((slot) => slot.levelId.startsWith('lab-'))).toBe(false);
  });

  it('reserves 70–75 for the accepted Spike reveal and places all eight bridges before it', () => {
    expect(MASTERY_V2_BLUEPRINT.slots.slice(69, 75).map((slot) => slot.levelId)).toEqual([
      'lesson-22', 'lesson-23', 'lesson-24', 'lesson-25', 'lesson-26', 'lesson-27',
    ]);
    const bridgeSlots = MASTERY_V2_BLUEPRINT.slots.filter((slot) => slot.seriesId === 'H');
    expect(bridgeSlots).toHaveLength(8);
    expect(Math.max(...bridgeSlots.map((slot) => slot.displayNumber))).toBe(69);
  });

  it('allocates all sixty new levels and the requested target-difficulty distribution', () => {
    const additions = MASTERY_V2_BLUEPRINT.slots.filter((slot) => slot.source === 'new');
    expect(additions).toHaveLength(60);
    expect(Object.fromEntries(['P', 'H', 'G', 'I', 'R', 'T', 'S', 'C', 'U'].map((seriesId) => [
      seriesId,
      additions.filter((slot) => slot.seriesId === seriesId).length,
    ]))).toEqual({ P: 12, H: 8, G: 4, I: 6, R: 6, T: 6, S: 6, C: 6, U: 6 });

    expect(Object.fromEntries(Array.from({ length: 9 }, (_, index) => {
      const difficulty = index + 2;
      return [difficulty, additions.filter((slot) => slot.targetDifficulty === difficulty).length];
    }))).toEqual({ 2: 3, 3: 5, 4: 8, 5: 9, 6: 9, 7: 8, 8: 9, 9: 5, 10: 4 });
  });

  it('marks only machine-verified authored additions as candidates', () => {
    expect(MASTERY_V2_BLUEPRINT.slots.filter((slot) => slot.state === 'candidate').map((slot) => slot.levelId))
      .toEqual(Array.from({ length: 10 }, (_, index) => `mastery-push-footprint-${String(index + 1).padStart(2, '0')}`));
  });
});
