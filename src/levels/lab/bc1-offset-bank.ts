import type { LevelSpec } from '../../course/types';
const id = 'lab-bc1-offset-bank';
const c = (x: number, y: number) => ({ x, y });

export const bc1OffsetBank: LevelSpec = {
  id, groupId: 'batch-c-berth', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-rs10-self-stop-bank'],
  techniques: [{ techniqueId: 'rain-stop', role: 'primary' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '折汀', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'rain', player: c(2, 2),
    walls: [c(0, 0), c(0, 1), c(0, 4), c(3, 4)],
    terrainGoals: [c(3, 2)], terrainSpikes: [],
    blocks: [{ id: `${id}-a`, position: c(1, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中玩家滑到阻挡前；邻接推动仅移动一格。'],
    proposition: '只对齐目标行不够：先越过该行取得横向推侧，再折回，以物件自身提供最终接近停点。',
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-a:from:1,2:to:1,3` } }],
    milestones: [],
    contrastVariable: '在 (4,1) 增加静态止挡后，可不越过目标行且不借物件停靠完成。',
    readabilityElements: ['cell:2,1', 'cell:3,3'],
  },
};
