import type { LevelSpec } from '../../course/types';
import { e05SharedBridge } from './e05-shared-bridge';

const lowerId = 'lab-e05-lower-landing';
export const e05LowerLanding: LevelSpec = {
  ...e05SharedBridge,
  id: lowerId,
  groupId: 'lab-e05-retrieval-contrast',
  role: 'practice',
  cognitiveStage: 'reinforce',
  prerequisites: ['lab-e04-shared-court'],
  difficulty: { target: 4, authorRating: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e05SharedBridge.board,
    id: lowerId,
    title: '临庭',
    player: { x: 4, y: 4 },
    walls: [...e05SharedBridge.board.walls, { x: 0, y: 0 }],
    terrainGoals: e05SharedBridge.board.terrainGoals.map(goal =>
      goal.x === 0 && goal.y === 0 ? { x: 1, y: 4 }
        : goal.y === 0 && (goal.x === 1 || goal.x === 2) ? { ...goal, y: 2 } : goal),
    blocks: e05SharedBridge.board.blocks.map(block => ({ ...block, id: `${lowerId}-${block.id.slice(-1)}` })),
  },
  theorem: {
    axioms: e05SharedBridge.theorem.axioms,
    proposition: '让出竖物通路的左侧落点能够延续到单格物终点；该安排仍须与竖物换侧协调。',
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${lowerId}-c:from:3,4:to:2,4` } }],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${lowerId}-a:from:3,1:to:3,2` } }],
    // Preserve the comparison scaffold: these cells provide the upper variant's retrieval route.
    readabilityElements: ['cell:2,5', 'cell:3,5', 'cell:4,5'],
  },
};

const upperId = 'lab-e05-upper-landing';
export const e05UpperLanding: LevelSpec = {
  ...e05LowerLanding,
  id: upperId,
  role: 'boundary',
  cognitiveStage: 'overturn',
  prerequisites: [lowerId],
  difficulty: { target: 5, authorRating: 7, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e05LowerLanding.board,
    id: upperId,
    title: '望庭',
    terrainGoals: e05LowerLanding.board.terrainGoals.map(goal =>
      goal.x === 1 && goal.y === 4 ? { x: 3, y: 0 } : goal),
    blocks: e05LowerLanding.board.blocks.map(block => ({ ...block, id: `${upperId}-${block.id.slice(-1)}` })),
  },
  theorem: {
    axioms: e05LowerLanding.theorem.axioms,
    proposition: '终点迁移后，旧让路落点不再可用；须改变竖物的临时布置，让单格物保留向上运出的条件。',
    // The preparations are necessary, but their total order is not unique.
    proofConditions: [
      { kind: 'event', event: { key: `event:block-pushed:${upperId}-a:from:3,1:to:2,1` } },
      { kind: 'event', event: { key: `event:block-pushed:${upperId}-a:from:2,1:to:2,2` } },
      { kind: 'event', event: { key: `event:block-pushed:${upperId}-c:from:3,4:to:3,3` } },
    ],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${upperId}-c:from:3,3:to:3,2` } }],
    contrastVariable: '仅将单格目标从 (1,4) 移到 (3,0)，旧左推方案由可解变为无解。',
  },
};
