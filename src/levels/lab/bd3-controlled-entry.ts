import type { LevelSpec } from '../../course/types';

const id = 'lab-bd3-controlled-entry';
const c = (x: number, y: number) => ({ x, y });

export const bd3ControlledEntry: LevelSpec = {
  id, groupId: 'batch-d-entry', role: 'inference', cognitiveStage: 'synthesize',
  prerequisites: ['lab-bd2-shifted-entry'],
  techniques: [
    { techniqueId: 'gate-remote-pushability', role: 'primary' },
    { techniqueId: 'gate-entry-direction', role: 'support' },
  ],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '借隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 9, height: 3, weather: 'clear', player: c(1, 0),
    walls: [c(4, 0), c(8, 0), c(4, 1), c(0, 2), c(3, 2), c(4, 2)],
    terrainGoals: [c(3, 1), c(5, 2)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(7, 2), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(1, 1), shape: [c(0, 0)], number: 0, isFake: false },
    ],
    goals: [],
    gates: [
      { id: `${id}-entry`, position: c(2, 1), shape: [c(0, 0)], nextGateId: `${id}-exit` },
      { id: `${id}-exit`, position: c(6, 1), shape: [c(0, 0)], nextGateId: `${id}-entry` },
    ],
    spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Gate 远端落点受阻时尝试推动入口；否则沿入射方向从配对出口离开。'],
    proposition: '先主动用任务箱堵住远端落点，才可把入口推出另一箱的运输线；再使用移动后的入口回收远端任务。',
    proofConditions: [{ kind: 'sequence', events: [
      { key: `event:block-pushed:${id}-a` },
      { key: `event:gate-pushed:${id}-entry` },
      { key: `event:gate-traversed:entry:${id}-entry` },
    ] }],
    milestones: [],
    contrastVariable: '仅将入口初始位置从 (2,1) 移到 (2,2)，解除运输线占用后无需主动造阻挡。',
  },
};
