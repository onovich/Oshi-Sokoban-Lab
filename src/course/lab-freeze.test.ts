import { expect, it } from 'vitest';
import { masteryV2Catalog } from './course-catalog';
import { auditLaboratoryFreeze, LABORATORY_FREEZE_MANIFEST } from './lab-freeze';

it('protects 13 selected laboratory boards and detects missing or altered originals', () => {
  expect(Object.keys(LABORATORY_FREEZE_MANIFEST)).toHaveLength(13);
  expect(auditLaboratoryFreeze(masteryV2Catalog.labLevels)).toEqual([]);
  const id = 'lab-e05-shared-bridge';
  expect(auditLaboratoryFreeze(masteryV2Catalog.labLevels.filter(level => level.id !== id)))
    .toEqual([{ id, kind: 'missing' }]);
  const altered = masteryV2Catalog.labLevels.map(level => level.id === id ? {
    ...level, board: { ...level.board, walls: [] },
  } : level);
  expect(auditLaboratoryFreeze(altered)).toEqual([{ id, kind: 'changed' }]);
});
