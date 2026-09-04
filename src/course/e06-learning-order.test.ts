import { describe, expect, it } from 'vitest';
import { masteryV2Catalog } from './course-catalog';
import { getNextCourseLevelId, getUnlockedCourseLevelIds } from '../levels/course-progress';
import { frozenLevelHash } from './accepted-freeze';

const sequence = ['lab-e06-small-court', 'lab-e06-independent-return', 'lab-e06-interleaved'];

describe('accepted E06 learning order', () => {
  it.each([
    ['lab-e06-small-court', '0a19378f'],
    ['lab-e06-independent-return', '199e1aba'],
    ['lab-e06-interleaved', 'abf22651'],
  ])('preserves the accepted board and theorem of %s while editing teaching metadata', (id, hash) => {
    expect(frozenLevelHash(masteryV2Catalog.labLevels.find((level) => level.id === id)!)).toBe(hash);
  });
  it('orders selection, the curriculum group and progression from short court through bypass to loop', () => {
    expect(masteryV2Catalog.labLevels.filter((level) => sequence.includes(level.id))
      .map((level) => level.id)).toEqual(sequence);
    const group = masteryV2Catalog.labGroups.find((item) => item.levelIds.includes(sequence[0]!))!;
    expect(group.levelIds).toEqual(sequence);
    expect(getUnlockedCourseLevelIds([group], [])).toEqual(new Set([sequence[0]]));
    expect(getNextCourseLevelId([group], sequence[0]!, [sequence[0]!])).toBe(sequence[1]);
    expect(getNextCourseLevelId([group], sequence[1]!, sequence.slice(0, 2))).toBe(sequence[2]);
  });
});
