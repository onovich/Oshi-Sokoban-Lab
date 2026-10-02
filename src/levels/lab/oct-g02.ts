import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g02';
const c = (x: number, y: number) => ({ x, y });
export const octG02: LevelSpec = {
  id, groupId: 'oct-gate', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-bd2-shifted-entry'],
  techniques: [{ techniqueId: 'gate-working-position', role: 'primary' }],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '折隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(4, 3),
    walls: [c(3, 0), c(4, 0), c(1, 3)], terrainGoals: [c(0, 3), c(4, 2)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(2, 1), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(0, 2), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [
      { id: `${id}-e`, position: c(2, 0), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(1, 2), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Gate 可推动时是实体；可通过时提供远端站位。'],
    proposition: 'Gate 的通路用途不能替代本地让路：为释放箱子运输行，必须在两条轴上调整同一门的暂存位置。',
    proofConditions: [
      { kind: 'event', event: { key: `event:gate-pushed:${id}-x` } },
      { kind: 'event', event: { key: 'event:gate-traversed' } },
    ], milestones: [],
    contrastVariable: '只开放 (1,3) 独立下方通路，解除同一门在两条轴推动的必要性。',
    readabilityElements: ['cell:0,0', 'cell:4,1', 'cell:2,3', 'cell:3,3'],
  },
};
