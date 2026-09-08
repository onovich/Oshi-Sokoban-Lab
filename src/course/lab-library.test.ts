import { describe, expect, it } from 'vitest';
import { masteryV2Catalog } from './course-catalog';
import { laboratoryShelf, nextLibraryLevelId } from './lab-library';

describe('curated laboratory navigation', () => {
  it('keeps every historical level accessible but separates archives from learning chains', () => {
    const shelves = laboratoryShelf(masteryV2Catalog.labLevels);
    const ids = shelves.flatMap(shelf => shelf.levelIds);
    expect(ids).toHaveLength(27);
    expect(new Set(ids)).toEqual(new Set(masteryV2Catalog.labLevels.map(level => level.id)));
    expect(shelves[0]!.levelIds).toEqual([
      'lab-e06-small-court', 'lab-e06-independent-return', 'lab-e06-interleaved',
    ]);
    expect(shelves.find(shelf => shelf.id === 'archive')!.levelIds).toContain('lab-e03-west-court');
    expect(nextLibraryLevelId(shelves, 'lab-e05-upper-landing')).toBeUndefined();
    expect(nextLibraryLevelId(shelves, 'lab-e05-lower-landing')).toBe('lab-e05-upper-landing');
  });
});
