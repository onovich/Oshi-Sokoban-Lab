import { describe, expect, it } from 'vitest';

import type { LevelSpec } from '../engine/types';
import { occupancyLevels } from './families/occupancy-levels';
import { auditLevelMutations, auditProofCriticalElements } from './level-mutation-audit';

function fixture(): LevelSpec {
  const board = occupancyLevels[0]!;
  return {
    id: board.id,
    groupId: 'mutation-fixture',
    role: 'establish',
    prerequisites: [],
    board,
    theorem: {
      axioms: ['多格 Block 整体移动。'],
      proposition: '必须推动指定 Block。',
      requiredPredicates: ['event:block-pushed:occupancy-guide-domino'],
      criticalEvent: 'event:block-pushed:occupancy-guide-domino',
    },
  };
}

describe('level mutation audit', () => {
  it('proves a predicate-named entity is critical by deleting it and re-solving', () => {
    const mutations = auditProofCriticalElements(fixture());

    expect(mutations).toEqual([
      expect.objectContaining({
        kind: 'entity-removal',
        target: 'block:occupancy-guide-domino',
        effect: 'bypass-created',
        proofCritical: true,
      }),
    ]);
  });

  it('walls every initially empty walkable cell and reports whether the mutation matters', () => {
    const mutations = auditLevelMutations(fixture());
    const wallMutations = mutations.filter((mutation) => mutation.kind === 'wall-insertion');

    expect(wallMutations.length).toBeGreaterThan(0);
    expect(wallMutations.every((mutation) => /^cell:\d+,\d+$/.test(mutation.target))).toBe(true);
    expect(wallMutations.some((mutation) => mutation.effect === 'unsolvable')).toBe(true);
  });
});

