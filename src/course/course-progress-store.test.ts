import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog, masteryV2Catalog } from './course-catalog';
import {
  loadCourseProgress,
  saveCourseProgress,
} from './course-progress-store';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('versioned course progress', () => {
  it('persists stable ids and safely ignores unknown or retired ids', () => {
    const storage = memoryStorage();
    saveCourseProgress(storage, acceptedFoundationCatalog, 'formal', [
      'lesson-01',
      'lesson-22',
      'retired-lesson',
    ]);

    expect(loadCourseProgress(storage, acceptedFoundationCatalog, 'formal')).toEqual([
      'lesson-01',
      'lesson-22',
    ]);
  });

  it('isolates formal, laboratory, and mastery-v2 completion', () => {
    const storage = memoryStorage();
    saveCourseProgress(storage, acceptedFoundationCatalog, 'formal', ['lesson-01']);
    saveCourseProgress(storage, acceptedFoundationCatalog, 'lab', ['lab-spike-clear']);

    expect(loadCourseProgress(storage, acceptedFoundationCatalog, 'formal')).toEqual(['lesson-01']);
    expect(loadCourseProgress(storage, acceptedFoundationCatalog, 'lab')).toEqual(['lab-spike-clear']);
    expect(loadCourseProgress(storage, masteryV2Catalog, 'formal')).toEqual([]);
  });

  it('treats malformed or future-schema data as empty progress', () => {
    const storage = memoryStorage();
    storage.setItem('oshi:course-progress:accepted-foundation-v1:formal', '{"schemaVersion":99}');
    storage.setItem('oshi:course-progress:accepted-foundation-v1:lab', 'not json');

    expect(loadCourseProgress(storage, acceptedFoundationCatalog, 'formal')).toEqual([]);
    expect(loadCourseProgress(storage, acceptedFoundationCatalog, 'lab')).toEqual([]);
  });
});
