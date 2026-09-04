import type { LevelSpec } from '../../course/types';
import { proofConditionFromLegacy } from '../../course/proof-condition';

const cell = (x: number, y: number) => ({ x, y });
const id = 'lab-e06-interleaved';
const handoff = proofConditionFromLegacy(
  `event-sequence:event:block-pushed:${id}-a:from:3,3:to:2,3>` +
  `event:block-pushed:${id}-c:from:3,2:to:3,1>` +
  `event:block-pushed:${id}-b:from:1,3:to:1,2>` +
  `event:block-pushed:${id}-a:from:2,3:to:1,3`,
);

/** Author-accepted lab level; unfamiliar-player calibration is still pending. */
export const e06Prototype: LevelSpec = {
  id,
  groupId: 'lab-e06-spatial',
  role: 'inference',
  cognitiveStage: 'stress',
  prerequisites: ['lab-e06-independent-return'],
  techniques: [
    { techniqueId: 'interleaved-preparation', role: 'primary' },
    { techniqueId: 'recoverable-intermediate-state', role: 'support' },
  ],
  difficulty: { target: 5, authorRating: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    id,
    title: '回环',
    description: '实验候选，尚未校准难度。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 6,
    height: 5,
    weather: 'clear',
    player: cell(3, 0),
    walls: [
      cell(0, 0), cell(1, 0), cell(2, 0), cell(0, 1), cell(1, 1), cell(2, 1),
      cell(5, 3), cell(4, 4), cell(5, 4),
    ],
    terrainGoals: [cell(3, 3), cell(3, 4), cell(5, 1), cell(4, 0)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: cell(4, 1), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
      { id: `${id}-b`, position: cell(3, 1), shape: [cell(0, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(2, 2), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [],
    gates: [],
    spikes: [],
    paths: [],
  },
  theorem: {
    axioms: ['Block 只能推不能拉；每个组成格参与碰撞和 Goal 覆盖。'],
    proposition: '共享通路必须分阶段交接；三件任务交错准备之后，才能形成可执行的收尾。',
    proofConditions: [handoff],
    // The second staging position reopens the south-to-west route. It is not a win event.
    milestones: [handoff],
    contrastVariable: '共享通路旁的独立返回站位。',
  },
};

export const e06Contrast: LevelSpec = {
  ...e06Prototype,
  id: 'lab-e06-independent-return',
  prerequisites: ['lab-e06-small-court'],
  role: 'boundary',
  difficulty: { target: 3, authorRating: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e06Prototype.board,
    id: 'lab-e06-independent-return',
    title: '旁路',
    description: '结构对照，尚未完成陌生玩家难度校准。',
    walls: e06Prototype.board.walls.filter((wall) => wall.x !== 2 || wall.y !== 1),
  },
  theorem: {
    ...e06Prototype.theorem,
    proposition: '只开放独立返回站位，检验原三方交接是否不再必要。',
  },
};

export const e06ExperimentLevels: readonly LevelSpec[] = [e06Prototype, e06Contrast];
