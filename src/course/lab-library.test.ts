import { describe, expect, it } from 'vitest';
import { masteryV2Catalog } from './course-catalog';
import { laboratoryShelf, nextLibraryLevelId } from './lab-library';

describe('curated laboratory navigation', () => {
  it('uses the observed Goal learning order without renumbering historical levels', () => {
    const shelves = laboratoryShelf(masteryV2Catalog.labLevels);
    expect(nextLibraryLevelId(shelves, 'lab-gc03-goal-handoff')).toBe('lab-gc01-goal-return');
    expect(nextLibraryLevelId(shelves, 'lab-gc01-goal-return')).toBeUndefined();
    expect(masteryV2Catalog.labLevels[27]!.id).toBe('lab-gc01-goal-return');
    expect(masteryV2Catalog.labLevels[28]!.id).toBe('lab-gc03-goal-handoff');
    const transfer = masteryV2Catalog.labLevels[28]!;
    expect(transfer.prerequisites).not.toContain('lab-gc01-goal-return');
    expect(transfer.difficulty.authorRating).toBe(6);
    expect(transfer.difficulty.sampleSize).toBe(0);
  });
  it('keeps every historical level accessible but separates archives from learning chains', () => {
    const shelves = laboratoryShelf(masteryV2Catalog.labLevels);
    const ids = shelves.flatMap(shelf => shelf.levelIds);
    expect(ids).toHaveLength(51);
    expect(new Set(ids)).toEqual(new Set(masteryV2Catalog.labLevels.map(level => level.id)));
    expect(shelves[0]!.levelIds).toEqual([
      'lab-e06-small-court', 'lab-e06-independent-return', 'lab-e06-interleaved',
    ]);
    expect(shelves.find(shelf => shelf.id === 'archive')!.levelIds).toContain('lab-e03-west-court');
    expect(nextLibraryLevelId(shelves, 'lab-e05-upper-landing')).toBeUndefined();
    expect(nextLibraryLevelId(shelves, 'lab-rs07-release-bank')).toBeUndefined();
    expect(masteryV2Catalog.labLevels[36]!.id).toBe('lab-rs07-release-bank');
    expect(masteryV2Catalog.labLevels[37]!.id).toBe('lab-rs08-placement-bank');
    expect(nextLibraryLevelId(shelves, 'lab-rs08-placement-bank')).toBeUndefined();
    expect(masteryV2Catalog.labLevels[38]!.id).toBe('lab-rs09-alignment-bank');
    expect(nextLibraryLevelId(shelves, 'lab-rs09-alignment-bank')).toBeUndefined();
    expect(masteryV2Catalog.labLevels[39]!.id).toBe('lab-rs10-self-stop-bank');
    expect(nextLibraryLevelId(shelves, 'lab-rs10-self-stop-bank')).toBeUndefined();
    expect(nextLibraryLevelId(shelves, 'lab-e05-lower-landing')).toBe('lab-e05-upper-landing');
    expect(masteryV2Catalog.labLevels[42]!.id).toBe('lab-bc1-offset-bank');
    expect(shelves.find(shelf => shelf.id === 'batch-c-berth')!.levelIds).toEqual(['lab-bc1-offset-bank', 'lab-bc2-borrowed-stop']);
    expect(masteryV2Catalog.labLevels[43]!.id).toBe('lab-ba3-two-stage-parking');
    expect(nextLibraryLevelId(shelves, 'lab-ba2-shared-bay')).toBe('lab-ba3-two-stage-parking');
    expect(masteryV2Catalog.labLevels[44]!.id).toBe('lab-bc2-borrowed-stop');
    expect(nextLibraryLevelId(shelves, 'lab-bc1-offset-bank')).toBe('lab-bc2-borrowed-stop');
    expect(masteryV2Catalog.labLevels[45]!.id).toBe('lab-bb1-goal-workspace');
    expect(shelves.find(shelf => shelf.id === 'batch-b-workspace')!.levelIds).toEqual(['lab-bb1-goal-workspace', 'lab-bb2-goal-permission']);
    expect(masteryV2Catalog.labLevels[46]!.id).toBe('lab-bd1-direction-choice');
    expect(shelves.find(shelf => shelf.id === 'batch-d-entry')!.levelIds).toEqual(['lab-bd1-direction-choice', 'lab-bd2-shifted-entry', 'lab-bd3-controlled-entry']);
    expect(masteryV2Catalog.labLevels[47]!.id).toBe('lab-bd2-shifted-entry');
    expect(nextLibraryLevelId(shelves, 'lab-bd1-direction-choice')).toBe('lab-bd2-shifted-entry');
  });
});
