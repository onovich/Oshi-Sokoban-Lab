import { describe, expect, it } from 'vitest';

import { masteryV2Catalog } from '../course/course-catalog';
import { courseGroups } from './course-catalog';
import {
  getNextCourseLevelId,
  getNextSequentialLevelId,
  getUnlockedCourseLevelIds,
} from './course-progress';

describe('sequential free navigation', () => {
  const playableIds = masteryV2Catalog.levels.map((level) => level.id);

  it('follows catalog order rather than the numbers embedded in stable ids', () => {
    expect(getNextSequentialLevelId(playableIds, 'lesson-33'))
      .toBe('mastery-push-footprint-01');
  });

  it('continues across a group boundary from display slot 33 to 34', () => {
    expect(getNextSequentialLevelId(playableIds, 'mastery-push-footprint-03'))
      .toBe('mastery-push-footprint-04');
  });

  it('skips unimplemented slots and continues from display slot 36 to playable slot 38', () => {
    expect(getNextSequentialLevelId(playableIds, 'mastery-push-footprint-06'))
      .toBe('lesson-34');
  });

  it('does not wrap around after the last playable lesson', () => {
    expect(getNextSequentialLevelId(playableIds, 'lesson-63')).toBeUndefined();
  });

  it('does not restart navigation when the current lesson is absent or the area is empty', () => {
    expect(getNextSequentialLevelId(playableIds, 'lab-spike-clear')).toBeUndefined();
    expect(getNextSequentialLevelId([], 'lesson-01')).toBeUndefined();
  });
});

describe('branched course progression', () => {
  it('keeps lessons linear inside a group and opens the six base branches after lesson 02', () => {
    expect([...getUnlockedCourseLevelIds(courseGroups, [])]).toEqual(['lesson-01']);
    expect([...getUnlockedCourseLevelIds(courseGroups, ['lesson-01'])]).toEqual(['lesson-01', 'lesson-02']);

    expect([...getUnlockedCourseLevelIds(courseGroups, ['lesson-01', 'lesson-02'])]).toEqual([
      'lesson-01',
      'lesson-02',
      'lesson-03',
      'lesson-04',
      'lesson-16',
      'lesson-19',
      'lesson-28',
      'lesson-34',
      'lesson-40',
    ]);
  });

  it('opens the Spike reinterpretation group only after all three respawn lessons', () => {
    const throughBoundary = ['lesson-01', 'lesson-02', 'lesson-19', 'lesson-20'];
    const throughInference = [...throughBoundary, 'lesson-21'];

    expect(getUnlockedCourseLevelIds(courseGroups, throughBoundary).has('lesson-22')).toBe(false);
    expect(getUnlockedCourseLevelIds(courseGroups, throughInference).has('lesson-22')).toBe(true);
  });

  it('awards mastery after the boundary lesson without requiring the inference lesson', () => {
    const completed = ['lesson-01', 'lesson-02', 'lesson-04', 'lesson-05'];
    const unlocked = getUnlockedCourseLevelIds(courseGroups, completed);

    expect(unlocked.has('lesson-06')).toBe(true);
    expect(unlocked.has('lesson-07')).toBe(true);
  });

  it('requires both relevant mastery tokens before opening a combination group', () => {
    const footprintOnly = ['lesson-01', 'lesson-02', 'lesson-04', 'lesson-05'];
    const both = [...footprintOnly, 'lesson-19', 'lesson-20', 'lesson-21', 'lesson-22', 'lesson-23'];

    expect(getUnlockedCourseLevelIds(courseGroups, footprintOnly).has('lesson-49')).toBe(false);
    expect(getUnlockedCourseLevelIds(courseGroups, both).has('lesson-49')).toBe(true);
  });

  it('chooses the next lesson inside a group, then the lowest unlocked unfinished lesson', () => {
    expect(getNextCourseLevelId(courseGroups, 'lesson-01', ['lesson-01'])).toBe('lesson-02');
    expect(getNextCourseLevelId(courseGroups, 'lesson-02', ['lesson-01', 'lesson-02'])).toBe('lesson-03');
    expect(getNextCourseLevelId(courseGroups, 'lesson-03', ['lesson-01', 'lesson-02', 'lesson-03'])).toBe('lesson-04');
  });
});
