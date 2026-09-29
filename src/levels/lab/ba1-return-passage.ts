import type { LevelSpec } from '../../course/types';

const id = 'lab-ba1-return-passage';
const c = (x: number, y: number) => ({ x, y });
const floor = new Set([
  '3,1', '3,2', '3,3', '3,4', '3,5', '3,6', '1,4', '2,4', '2,5',
  '4,4', '5,4', '6,4', '5,1', '5,2', '6,2', '5,3', '6,3', '4,1', '4,0',
]);

export const ba1ReturnPassage: LevelSpec = {
  id, groupId: 'batch-a-return', role: 'practice', cognitiveStage: 'reinforce',
  prerequisites: ['lesson-03', 'lesson-06'],
  techniques: [{ techniqueId: 'return-route-reservation', role: 'primary' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '折廊', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 7, height: 7, weather: 'clear', player: c(2, 5),
    walls: Array.from({ length: 49 }, (_, i) => c(i % 7, Math.floor(i / 7)))
      .filter(cell => !floor.has(`${cell.x},${cell.y}`)),
    terrainGoals: [c(3, 5), c(3, 6), c(1, 4)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(3, 3), shape: [c(0, 0), c(0, 1)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(5, 3), shape: [c(0, 0)], number: 0, isFake: false },
    ],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；刚性形状不可旋转；完整占格。'],
    proposition: '让竖条腾出通路时，需要保留将它移回来的推侧，不能直接推到底。',
    proofConditions: [
      { kind: 'event', event: { key: `event:block-pushed:${id}-a:from:3,3:to:3,2` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-a:from:3,2:to:3,3` } },
    ],
    milestones: [],
    contrastVariable: '仅开放 (3,0) 回收站位，竖条推到底的错误前缀由无解变为可恢复。',
    readabilityElements: ['cell:4,0'],
  },
};
