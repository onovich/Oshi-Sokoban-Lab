import type { LevelSpec } from '../../course/types';

const id = 'lab-rs01-rain-staging';
const cell = (x: number, y: number) => ({ x, y });

/** Candidate, not a calibrated difficulty or an accepted teaching progression. */
export const rs01RainStaging: LevelSpec = {
  id, groupId: 'lab-rain-staging', role: 'synthesis', cognitiveStage: 'synthesize',
  prerequisites: ['lab-e02-return-loan', 'lesson-36', 'lesson-39'],
  techniques: [
    { techniqueId: 'rain-stop', role: 'primary' },
    { techniqueId: 'recoverable-staging-handoff', role: 'support' },
  ],
  difficulty: { target: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '泊庭', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'rain', player: cell(4, 4),
    walls: [cell(0, 3), cell(1, 0), cell(1, 4), cell(0, 0), cell(0, 4)],
    terrainGoals: [cell(4, 1), cell(4, 2), cell(3, 4), cell(4, 4), cell(4, 0)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: cell(3, 2), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
      { id: `${id}-b`, position: cell(1, 1), shape: [cell(0, 0), cell(1, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(3, 1), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Rain 滑行与邻接一步推动；刚性形状完整占格；全部真实物件覆盖目标。'],
    proposition: '横物必须先深暂存再取回，单格物的位置与横物后续运输共同约束雨中推侧。',
    proofConditions: [
      { kind: 'event', event: { key: `event:block-pushed:${id}-b:from:1,2:to:1,3` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-b:from:1,3:to:1,2` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,3:to:2,3` } },
    ],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,3:to:2,3` } }],
    contrastVariable: '晴天行走解除中间停点需求；具体解耦另由测试核对。',
  },
};
