import type { LevelSpec } from '../../course/types';
const id = 'lab-bc2-borrowed-stop';
const c = (x: number, y: number) => ({ x, y });

export const bc2BorrowedStop: LevelSpec = {
  id, groupId: 'batch-c-berth', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-bc1-offset-bank'],
  techniques: [{ techniqueId: 'rain-stop', role: 'primary' }],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '借汀', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 4, height: 5, weather: 'rain', player: c(0, 0),
    walls: [c(2, 0), c(0, 2), c(0, 3), c(0, 4), c(1, 4)],
    terrainGoals: [c(3, 0), c(1, 3)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(2, 1), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(2, 3), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中玩家滑至阻挡前；相邻推动只移动一格；完成的 Block 仍占据空间。'],
    proposition: '暂缓完成上方物件，用它提供另一物件的推侧停点，之后两件仍可正常收尾。',
    // A location event is a necessary landmark, not the whole support relation.
    // The immediate A-stop -> B-push relation has an independent real-move graph test.
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-b:from:2,3:to:2,2` } }],
    milestones: [],
    contrastVariable: '仅在 (3,4) 增静态止挡后，可直接取得 B 的推侧，无需借 A 停靠。',
  },
};
