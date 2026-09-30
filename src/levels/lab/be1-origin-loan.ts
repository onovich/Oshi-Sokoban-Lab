import type { LevelSpec } from '../../course/types';
const id = 'lab-be1-origin-loan';
const c = (x: number, y: number) => ({ x, y });

export const be1OriginLoan: LevelSpec = {
  id, groupId: 'batch-e-origin', role: 'boundary', cognitiveStage: 'stress',
  prerequisites: ['lesson-24'],
  techniques: [{ techniqueId: 'spike-reset', role: 'primary' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '归隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 6, height: 4, weather: 'clear', player: c(1, 2),
    walls: [c(3,0),c(4,0),c(5,0),c(1,1),c(3,1),c(4,1),c(5,1),c(0,3),c(4,3),c(5,3)],
    terrainGoals: [c(0,2),c(2,3)], terrainSpikes: [c(5,2)],
    blocks: [
      { id: `${id}-a`, position: c(2,2), shape: [c(0,0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(2,1), shape: [c(0,0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['真实 Block 触刺时尝试回到出生占格；其他真实 Block 占用该位置会阻止本次回位。'],
    proposition: '让出并借用出生点后释放它，借触刺回位取得通常运输无法获得的反向推侧。',
    proofConditions: [{ kind: 'event', event: { key: `event:object-reset:block:${id}-a` } }],
    milestones: [],
    readabilityElements: ['cell:1,3', 'cell:3,3'],
    contrastVariable: '打开 (3,0)、(3,1) 的局部绕路后，可不用回位而取得反向推侧。',
  },
};
