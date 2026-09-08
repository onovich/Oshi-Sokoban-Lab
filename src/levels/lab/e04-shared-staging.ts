import type { LevelSpec } from '../../course/types';
import { e02Prototype } from './e02-experiment';

const id = 'lab-e04-shared-court';
export const e04SharedCourt: LevelSpec = {
  ...e02Prototype,
  id,
  groupId: 'lab-e04-staging',
  prerequisites: ['lab-e02-return-loan'],
  difficulty: { target: 5, authorRating: 7, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e02Prototype.board, id, title: '合庭', height: 6,
    walls: [...e02Prototype.board.walls, { x: 0, y: 5 }, { x: 1, y: 5 }],
    terrainGoals: [...e02Prototype.board.terrainGoals, { x: 1, y: 4 }],
    blocks: [
      ...e02Prototype.board.blocks.map(b => ({ ...b, id: `${id}-${b.id.slice(-1)}` })),
      { id: `${id}-c`, position: { x: 3, y: 3 }, shape: [{x:0,y:0}], number: 0, isFake: false },
    ],
  },
  theorem: {
    axioms: e02Prototype.theorem.axioms,
    proposition: '单格物与横物争用南侧暂存区；暂存与完成必须服从竖物尚需的推动站位。',
    proofConditions: [{ kind: 'sequence', events: [
      { key: `event:block-pushed:${id}-c` },
      { key: `event:block-pushed:${id}-a:from:1,2:to:1,1` },
      { key: `event:block-pushed:${id}-c` },
    ] }],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-a:from:3,1:to:3,2` } }],
    contrastVariable: '只开放 (0,2) 的玩家推侧，使单格物提前完成不再封死竖物。',
  },
};
