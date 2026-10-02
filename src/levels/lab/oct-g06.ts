import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g06';
const c = (x: number, y: number) => ({ x, y });
export const octG06: LevelSpec = {
  id, groupId: 'oct-gate', role: 'synthesis', cognitiveStage: 'synthesize',
  prerequisites: ['lab-oct-g01', 'lab-oct-g02'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }],
  difficulty: { target: 7, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '连隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(4, 1),
    walls: [c(3, 2), c(4, 2), c(0, 3), c(3, 3), c(4, 3)],
    terrainGoals: [c(2, 2)], terrainSpikes: [],
    blocks: [{ id: `${id}-a`, position: c(3, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [
      { id: `${id}-e`, position: c(1, 2), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(2, 1), shape: [c(0, 0)], nextGateId: `${id}-e` },
      { id: `${id}-f`, position: c(0, 2), shape: [c(0, 0)], nextGateId: `${id}-y` },
      { id: `${id}-y`, position: c(1, 1), shape: [c(0, 0)], nextGateId: `${id}-f` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['另一对 Gate 同样会阻挡远端落点。'],
    proposition: '两对门不是独立通路：必须移动一对的端点，主动制造另一对的推动许可，才能清开箱子运输线。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-y` } }], milestones: [],
  },
};
