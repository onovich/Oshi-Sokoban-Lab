import type { LevelSpec } from '../../course/types';
const c = (x: number, y: number) => ({ x, y });
const id = 'lab-oct-s02';
export const octS02: LevelSpec = {
  id, groupId: 'oct-hazard-goal', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lesson-33'], techniques: [
    { techniqueId: 'movable-goal-staging', role: 'primary' },
    { techniqueId: 'spike-reset', role: 'support' },
  ],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '偏埠', description: '观察通路与可移动目标。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'clear', player: c(4, 0),
    walls: [c(2, 1), c(4, 1), c(4, 2), c(2, 3)],
    terrainGoals: [], terrainSpikes: [c(1, 0)],
    blocks: [{ id: `${id}-a`, position: c(3, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [{ id: `${id}-g`, position: c(1, 2), shape: [c(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Goal 能推则推，受阻可穿；Goal 触刺返回出生点。'],
    proposition: '先把 Goal 暂置边侧，借受阻可穿取得转运推侧，不能从危险上口直接取位。',
    proofConditions: [{ kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:1,2:to:0,2` } }],
    milestones: [], contrastVariable: '只去掉 (1,0) Spike，允许从上口取得 Goal 左侧并向右准备目标。',
  },
};
