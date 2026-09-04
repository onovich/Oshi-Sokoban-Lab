import type { LevelSpec, ProofCondition } from '../../course/types';

const cell = (x: number, y: number) => ({ x, y });
const id = 'lab-e02-shared-bay';
const handoff: ProofCondition = {
  kind: 'sequence',
  events: [
    { key: `event:block-pushed:${id}-b:from:2,2:to:2,3` },
    { key: `event:block-pushed:${id}-a:from:1,2:to:1,1` },
    { key: `event:block-pushed:${id}-b:from:2,3:to:1,3` },
    { key: `event:block-pushed:${id}-a:from:3,1:to:3,2` },
  ],
};

/** D5 is a design hypothesis. Only real-rule machine evidence exists at this stage. */
export const e02Prototype: LevelSpec = {
  id,
  groupId: 'lab-e02-staging',
  role: 'inference',
  cognitiveStage: 'stress',
  prerequisites: ['mastery-push-footprint-04', 'lab-e06-small-court'],
  techniques: [
    { techniqueId: 'recoverable-staging-handoff', role: 'primary' },
    { techniqueId: 'push-side-preservation', role: 'support' },
  ],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id,
    title: '折返庭',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 5,
    height: 5,
    weather: 'clear',
    player: cell(0, 1),
    walls: [cell(4, 0), cell(4, 1), cell(0, 2), cell(0, 3), cell(0, 4)],
    terrainGoals: [cell(4, 2), cell(4, 3), cell(1, 0), cell(2, 0)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: cell(1, 2), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
      { id: `${id}-b`, position: cell(1, 1), shape: [cell(0, 0), cell(1, 0)], number: 0, isFake: false },
    ],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；刚性形状不可旋转；完整占格参与碰撞与静态 Goal 覆盖。'],
    proposition: '暂存必须保留取回推侧，并随另一个形状的运输分阶段交接同一片空间。',
    proofConditions: [handoff],
    // Finishes opening the east transport lane, not the last goal-covering push.
    milestones: [handoff],
    contrastVariable: '东侧独立暂存位及其取回站位。',
  },
};

export const e02Contrast: LevelSpec = {
  ...e02Prototype,
  id: 'lab-e02-independent-bay',
  role: 'boundary',
  cognitiveStage: 'reinforce',
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e02Prototype.board,
    id: 'lab-e02-independent-bay',
    title: '侧庭',
    width: 6,
    // Three connected cells form one independent bay and its retrieval access.
    walls: [cell(4, 0), cell(0, 2), cell(0, 3), cell(0, 4), cell(5, 0), cell(5, 3), cell(5, 4)],
  },
  theorem: {
    ...e02Prototype.theorem,
    proposition: '增加独立的可取回暂存区后，南侧空间的原交接不再必要。',
  },
};

export const e02ExperimentLevels: readonly LevelSpec[] = [e02Prototype, e02Contrast];
