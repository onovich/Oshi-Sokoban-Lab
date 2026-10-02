import type { LevelSpec } from '../../course/types';
const c = (x: number, y: number) => ({ x, y });
const id = 'lab-oct-s01';
export const octS01: LevelSpec = {
  id, groupId: 'oct-hazard-space', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lesson-06'],
  techniques: [{ techniqueId: 'footprint-clearance', role: 'primary' }],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '曲垣', description: '观察整体形状与可站立位置。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 6, weather: 'clear', player: c(2, 0),
    walls: [c(0, 0), c(1, 0), c(3, 0), c(4, 0), c(0, 1), c(4, 1),
      c(0, 2), c(0, 3), c(0, 4), c(0, 5)],
    terrainGoals: [c(1, 4), c(2, 4), c(1, 5)], terrainSpikes: [c(2, 2)],
    blocks: [{ id: `${id}-a`, position: c(3, 2),
      shape: [c(0, 0), c(1, 0), c(0, 1)], number: 0, isFake: false }],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['刚性形状不可旋转；完整占格触刺；Block 回到出生点，玩家留在触发侧。'],
    proposition: 'L 形物件先下移再转向，为完整形状留出避刺运输空间。',
    proofConditions: [{ kind: 'event', event: {
      key: `event:block-pushed:${id}-a:from:3,2:to:3,3`,
    } }],
    milestones: [],
    contrastVariable: '仅删除 (2,2) Spike，即允许不经初始下移的另一运输次序。',
  },
};
