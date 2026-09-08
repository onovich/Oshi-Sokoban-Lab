import type { LevelSpec } from '../../course/types';
import { e05SharedGoals } from './e05-shared-goals';

const id = 'lab-e05-shared-bridge';

/** Same scaffold, with the initial transport prepared, not the shared-space conflict removed. */
export const e05SharedBridge: LevelSpec = {
  ...e05SharedGoals,
  id,
  prerequisites: ['lab-e04-shared-court'],
  difficulty: { target: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e05SharedGoals.board,
    id,
    title: '间庭',
    walls: [...e05SharedGoals.board.walls, { x: 0, y: 1 }],
    player: { x: 2, y: 1 },
    blocks: e05SharedGoals.board.blocks.map(block => ({
      ...block,
      id: `${id}-${block.id.slice(-1)}`,
      position: block.id.endsWith('-a') ? { x: 3, y: 1 }
        : block.id.endsWith('-b') ? { x: 1, y: 3 } : { x: 3, y: 4 },
    })),
  },
  theorem: {
    axioms: e05SharedGoals.theorem.axioms,
    proposition: '三个物件共享回程和目标区；完成近处运输前，必须保留其余物件的重新安排条件。',
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-b:from:1,0:to:0,0` } }],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-b:from:1,0:to:0,0` } }],
  },
};
