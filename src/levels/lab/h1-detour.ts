import type { LevelSpec } from '../../course/types';
const id = 'lab-h1-detour';
const c = (x: number, y: number) => ({ x, y });

export const h1Detour: LevelSpec = {
  id, groupId: 'lab-hazard-bridges', role: 'transfer', cognitiveStage: 'seed',
  prerequisites: ['lesson-03'],
  techniques: [
    { techniqueId: 'push-side-access', role: 'primary' },
    { techniqueId: 'completion-order', role: 'primary' },
    { techniqueId: 'spike-reset', role: 'support' },
  ],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '迂径', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(0, 2),
    walls: [c(0,0), c(0,3), c(3,3), c(4,3)],
    terrainGoals: [c(4,2), c(3,0)], terrainSpikes: [c(3,2)],
    blocks: [
      { id: `${id}-a`, position: c(1,2), shape: [c(0,0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(2,0), shape: [c(0,0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['推动需要可到达的推侧；已完成 Block 仍占空间；触刺会使 Block 尝试回到出生点。'],
    proposition: '绕运下方物件时，暂缓上方近目标的收尾，为最终推动保留通路。',
    // Necessary non-final transport event; the full finishing-order relation is tested separately.
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-a:from:3,1:to:4,1` } }],
    milestones: [],
    // (0,1) permits the immediate URUR near-goal plan instead of forcing the initial A push.
    readabilityElements: ['cell:0,1'],
    contrastVariable: '只移除 Spike 后，可直推下方物件并允许上方物件先保持完成。',
  },
};
