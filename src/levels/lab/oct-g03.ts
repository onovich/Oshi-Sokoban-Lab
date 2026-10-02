import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g03';
const c = (x: number, y: number) => ({ x, y });
export const octG03: LevelSpec = {
  id, groupId: 'oct-gate', role: 'inference', cognitiveStage: 'synthesize',
  prerequisites: ['lab-bd3-controlled-entry', 'lesson-18'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }, { techniqueId: 'fake-resource', role: 'support' }],
  difficulty: { target: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '置隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(3, 2),
    walls: [c(2, 0), c(3, 0), c(4, 0), c(4, 2)], terrainGoals: [c(4, 1)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(1, 2), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-f`, position: c(0, 1), shape: [c(0, 0)], number: 0, isFake: true },
    ], goals: [], gates: [
      { id: `${id}-e`, position: c(2, 1), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(2, 3), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['Fake 不计入胜利，但仍能阻挡 Gate 的远端落点。'],
    proposition: 'Fake 的停放位置不是垃圾位置，而是移动 Gate 所需的远端挡点；需先布置它再协调真实箱与端点位置。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-e` } }], milestones: [],
    contrastVariable: '仅开放 (4,2) 独立运输格，可不借 Fake 控制远端许可而完成。',
    readabilityElements: ['cell:1,3', 'cell:4,3'],
  },
};
