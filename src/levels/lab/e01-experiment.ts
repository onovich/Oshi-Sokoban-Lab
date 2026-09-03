import { proofConditionFromLegacy } from '../../course/proof-condition';
import type { LevelSpec } from '../../course/types';
import { masteryCell as cell, wallsOutside } from '../mastery/mastery-level-helpers';

/**
 * Experimental, not a formal course slot or a calibrated D5.
 * Question: must B remain recoverably staged while A takes back its push side?
 * All transitions remain owned by the ordinary game engine.
 */
const id = 'lab-e01-shared-passage';
const openCells = [
  cell(2, 0), cell(3, 0), cell(4, 0),
  cell(1, 1), cell(2, 1), cell(3, 1), cell(4, 1),
  cell(0, 2), cell(1, 2), cell(2, 2), cell(4, 2),
  cell(0, 3), cell(1, 3), cell(2, 3), cell(3, 3), cell(4, 3),
  cell(0, 4),
];
const stagingSequence = proofConditionFromLegacy(
  `event-sequence:event:block-pushed:${id}-a:from:1,2:to:2,2>` +
  `event:block-pushed:${id}-b:from:2,1:to:3,1>` +
  `event:block-pushed:${id}-a:from:2,2:to:1,2`,
);
const deferredFinishSequence = proofConditionFromLegacy(
  `event-sequence:event:block-pushed:${id}-a:from:1,2:to:2,2>` +
  `event:block-pushed:${id}-b:from:2,1:to:3,1>` +
  `event:block-pushed:${id}-a:from:2,2:to:1,2>` +
  `event:block-pushed:${id}-b:from:3,1:to:4,1`,
);

export const e01Prototype: LevelSpec = {
  id,
  groupId: 'lab-e01-spatial',
  role: 'inference',
  cognitiveStage: 'stress',
  prerequisites: ['mastery-push-footprint-01', 'mastery-push-footprint-02', 'mastery-push-footprint-04'],
  techniques: [
    { techniqueId: 'recoverable-intermediate-state', role: 'primary' },
    { techniqueId: 'push-side-preservation', role: 'support' },
  ],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id,
    title: '折线',
    description: '实验候选，尚未校准难度。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 5,
    height: 5,
    weather: 'clear',
    player: cell(0, 4),
    walls: wallsOutside(5, 5, openCells),
    terrainGoals: [cell(0, 2), cell(0, 3), cell(4, 1)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: cell(1, 2), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
      { id: `${id}-b`, position: cell(2, 1), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [],
    gates: [],
    spikes: [],
    paths: [],
  },
  theorem: {
    axioms: ['Block 只能推不能拉；所有组成格都参与碰撞和 Goal 覆盖。'],
    proposition: 'B 必须暂存在未完成位置，保持绕行口畅通，才能让 A 再次调整并收尾。',
    // Event evidence is supplemented by the state-based counterfactual audit.
    proofConditions: [deferredFinishSequence],
    milestones: [stagingSequence],
    contrastVariable: '连接 B 推动路线与 A 回推侧的独立绕行口。',
    readabilityElements: ['cell:0,4'],
  },
};

export const e01Contrast: LevelSpec = {
  ...e01Prototype,
  id: 'lab-e01-independent-passage',
  role: 'boundary',
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e01Prototype.board,
    id: 'lab-e01-independent-passage',
    title: '对照',
    description: '结构对照，难度标签仅为设计预期，未实测。',
    walls: e01Prototype.board.walls.filter((wall) => wall.x !== 3 || wall.y !== 2),
  },
  theorem: {
    ...e01Prototype.theorem,
    proposition: '对照：只开放独立绕行口，检验主实验的暂存要求是否不再必要。',
  },
};

export const e01ExperimentLevels: readonly LevelSpec[] = [e01Prototype, e01Contrast];
