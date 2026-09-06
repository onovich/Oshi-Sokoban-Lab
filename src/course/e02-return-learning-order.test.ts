import { describe, expect, it } from 'vitest';

import { getNextCourseLevelId, getUnlockedCourseLevelIds } from '../levels/course-progress';
import { frozenLevelHash } from './accepted-freeze';
import { acceptedFoundationCatalog, masteryV2Catalog } from './course-catalog';

const sequence = [
  'lab-e02-return-door',
  'lab-e02-return-reservation',
  'lab-e02-return-loan',
];

describe('E02 return-position learning order', () => {
  it('places two complete precursors before the unchanged transfer puzzle', () => {
    expect(masteryV2Catalog.labLevels.filter((level) => sequence.includes(level.id))
      .map((level) => level.id)).toEqual(sequence);
    const group = masteryV2Catalog.labGroups.find((item) => item.id === 'lab-e02-return-position')!;
    expect(group.levelIds).toEqual(sequence);
    const prior = ['lab-e02-independent-bay'];
    expect(getUnlockedCourseLevelIds(masteryV2Catalog.labGroups, prior)).toContain(sequence[0]);
    expect(getNextCourseLevelId(
      masteryV2Catalog.labGroups,
      sequence[0]!,
      [...prior, sequence[0]!],
    )).toBe(sequence[1]);
    expect(getNextCourseLevelId(
      masteryV2Catalog.labGroups,
      sequence[1]!,
      [...prior, ...sequence.slice(0, 2)],
    )).toBe(sequence[2]);
  });

  it('keeps the hard map and theorem fingerprint while changing only its teaching placement', () => {
    const hardMap = masteryV2Catalog.labLevels.find((level) => level.id === sequence[2])!;
    expect(frozenLevelHash(hardMap)).toBe('2eec8e40');
    expect(hardMap.groupId).toBe('lab-e02-return-position');
    expect(hardMap.prerequisites).toEqual([sequence[1]]);
  });

  it('keeps all three experiments outside formal progress and the accepted laboratory', () => {
    for (const id of sequence) {
      expect(masteryV2Catalog.formalLevelOrder).not.toContain(id);
      expect(masteryV2Catalog.levels.some((level) => level.id === id)).toBe(false);
      expect(acceptedFoundationCatalog.labLevels.some((level) => level.id === id)).toBe(false);
    }
  });

  it('keeps the player-facing copy neutral while the internal theorem remains explicit', () => {
    const levels = sequence.map((id) =>
      masteryV2Catalog.labLevels.find((level) => level.id === id)!);
    expect(levels.map((level) => level.board.title)).toEqual(['窄门', '近岸', '再借庭']);
    for (const level of levels) {
      expect(level.board.description).not.toMatch(/返回|归还|先把|取回|站位|交接/);
      expect(level.theorem.proposition.length).toBeGreaterThan(0);
    }
  });
});
