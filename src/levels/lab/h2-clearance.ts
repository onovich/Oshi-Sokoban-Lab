import type { LevelSpec } from '../../course/types';
const id = 'lab-h2-clearance';
const c = (x: number, y: number) => ({ x, y });
export const h2Clearance: LevelSpec = {
  id, groupId: 'lab-shape-bridges', role: 'transfer', cognitiveStage: 'reinforce',
  prerequisites: ['lesson-06'],
  techniques: [{ techniqueId: 'whole-footprint', role: 'primary' },
    { techniqueId: 'push-side-access', role: 'primary' }, { techniqueId: 'spike-reset', role: 'support' }],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '偏径', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'clear', player: c(0,2),
    walls: [c(0,0),c(1,0),c(2,0),c(0,1),c(0,4),c(3,4),c(4,4)],
    terrainGoals: [c(4,2),c(4,3)], terrainSpikes: [c(3,3)],
    blocks: [{ id: `${id}-a`, position: c(1,2), shape: [c(0,0),c(0,1)], number: 0, isFake: false }],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['整块物件一起移动；任一组成格触刺都会尝试令整块回位；推动须取得对应推侧。'],
    proposition: '玩家所在行畅通不代表整块可安全横移；先从下侧抬起物件，让远端组成格避开障碍再运输。',
    // The lifting column is not unique. This pre-final transport landmark is necessary;
    // the independent full-state no-lift test proves the whole-footprint relation.
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-a:from:3,1:to:4,1` } }],
    milestones: [],
    // (0,3) enables initial lower-cell contact; (1,1) enables the raised upper-cell push side.
    readabilityElements: ['cell:0,3', 'cell:1,1'],
    contrastVariable: '只移除 Spike 后，同一物件无需升起即可沿初始行直推完成。',
  },
};
