import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g07', c = (x: number, y: number) => ({ x, y });
export const octG07: LevelSpec = {
  id, groupId: 'oct-gate', role: 'transfer', cognitiveStage: 'transfer', prerequisites: ['lab-oct-g06'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }],
  difficulty: { target: 7, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '返隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(4, 1),
    walls: [c(3, 2), c(4, 2), c(0, 3), c(3, 3), c(4, 3)], terrainGoals: [c(0, 0)], terrainSpikes: [],
    blocks: [{ id: `${id}-a`, position: c(3, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [
      { id: `${id}-e`, position: c(1, 2), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(2, 1), shape: [c(0, 0)], nextGateId: `${id}-e` },
      { id: `${id}-f`, position: c(0, 2), shape: [c(0, 0)], nextGateId: `${id}-y` },
      { id: `${id}-y`, position: c(1, 1), shape: [c(0, 0)], nextGateId: `${id}-f` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['Gate 的当前位置决定远端站位。'],
    proposition: '通路准备不能只向前腾空：任务落点改变后，至少一个已推动的端点必须反向调回，重新提供下一阶段推侧。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-e` } }], milestones: [],
    contrastVariable: '只把目标改回 (2,2)，同底板不再要求任何门反向推动。',
  },
};
