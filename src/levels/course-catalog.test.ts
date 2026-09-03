import { describe, expect, it } from 'vitest';

import { courseGroups, courseLevels } from './course-catalog';

describe('Oshi evidence-led course catalogue', () => {
  it('defines twenty-one ordered three-lesson groups and sixty-three playable specs', () => {
    expect(courseGroups).toHaveLength(21);
    expect(courseLevels).toHaveLength(63);

    for (const group of courseGroups) {
      const lessons = courseLevels.filter((level) => level.groupId === group.id);
      expect(lessons.map((lesson) => lesson.role)).toEqual(['establish', 'boundary', 'inference']);
      expect(lessons.map((lesson) => lesson.id)).toEqual(group.levelIds);
    }
  });

  it('keeps developer theorem metadata out of player-facing copy', () => {
    for (const level of courseLevels) {
      const playerCopy = [level.board.title, level.board.description, level.board.objective]
        .filter(Boolean)
        .join(' ');

      expect(level.theorem.axioms).not.toHaveLength(0);
      expect(level.theorem.proofConditions).not.toHaveLength(0);
      expect(level.theorem.milestones).not.toHaveLength(0);
      expect(playerCopy).not.toContain(level.theorem.proposition);
      expect(level.board.hint).toBeUndefined();
    }
  });
});
