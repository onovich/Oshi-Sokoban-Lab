import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog } from './course-catalog';
import {
  ACCEPTED_LEVEL_FREEZE_MANIFEST,
  auditAcceptedLevelFreeze,
} from './accepted-freeze';

describe('accepted lesson freeze manifest', () => {
  it('pins every accepted board and theorem to a checked-in normalized hash', () => {
    expect(Object.keys(ACCEPTED_LEVEL_FREEZE_MANIFEST)).toHaveLength(60);
    expect(auditAcceptedLevelFreeze(acceptedFoundationCatalog.levels)).toEqual([]);
    expect(Object.values(ACCEPTED_LEVEL_FREEZE_MANIFEST).every((hash) => /^[0-9a-f]{8}$/.test(hash)))
      .toBe(true);
  });

  it('detects a gameplay mutation while ignoring display copy', () => {
    const source = acceptedFoundationCatalog.levels[0]!;
    const gameplayMutation = {
      ...source,
      board: { ...source.board, player: { x: source.board.player.x + 1, y: source.board.player.y } },
    };
    const copyMutation = {
      ...source,
      board: { ...source.board, title: '重新命名的显示标题', description: '纯展示文案' },
    };

    expect(auditAcceptedLevelFreeze([gameplayMutation])).toEqual([
      expect.objectContaining({ id: source.id, kind: 'changed' }),
    ]);
    expect(auditAcceptedLevelFreeze([copyMutation])).toEqual([]);
  });
});
