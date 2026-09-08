import { frozenLevelHash } from './accepted-freeze';
import type { LevelSpec } from './types';

// Captured 2026-09-08 before curation. Preservation is not formal-course approval.
// Change a puzzle under a new stable ID; do not regenerate these hashes to pass tests.
export const LABORATORY_FREEZE_MANIFEST: Readonly<Record<string, string>> = {
  'lab-e06-small-court': '0a19378f',
  'lab-e06-independent-return': '199e1aba',
  'lab-e06-interleaved': 'abf22651',
  'lab-e02-return-door': '69accb81',
  'lab-e02-return-reservation': '8cfca703',
  'lab-e02-return-loan': '2eec8e40',
  'lab-e04-upper-route': 'cecbdf00',
  'lab-e04-middle-court': '6c4a5e12',
  'lab-e04-shared-court': '62becb02',
  'lab-e05-shared-goals': '651d006a',
  'lab-e05-shared-bridge': 'ca58440c',
  'lab-e05-lower-landing': 'a1e897c9',
  'lab-e05-upper-landing': '20f79cf3',
};

export function auditLaboratoryFreeze(levels: readonly LevelSpec[]): readonly Readonly<{
  id: string;
  kind: 'missing' | 'changed';
}>[] {
  const byId = new Map(levels.map(level => [level.id, level]));
  return Object.entries(LABORATORY_FREEZE_MANIFEST).flatMap<{ id: string; kind: 'missing' | 'changed' }>(([id, hash]) => {
    const level = byId.get(id);
    if (!level) return [{ id, kind: 'missing' as const }];
    return frozenLevelHash(level) === hash ? [] : [{ id, kind: 'changed' as const }];
  });
}
