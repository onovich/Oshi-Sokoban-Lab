import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g01';
const c = (x: number, y: number) => ({ x, y });
export const octG01: LevelSpec = {
  id, groupId: 'oct-gate', role: 'inference', cognitiveStage: 'synthesize',
  prerequisites: ['lab-bd3-controlled-entry'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }],
  difficulty: { target: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '互隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 9, height: 4, weather: 'clear', player: c(1, 0),
    walls: [c(4, 0), c(8, 0), c(4, 1), c(0, 2), c(4, 2),
      ...[0, 1, 2, 3, 4, 5, 7, 8].map(x => c(x, 3))],
    terrainGoals: [c(3, 2), c(6, 3)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(7, 2), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(1, 1), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [
      { id: `${id}-entry`, position: c(2, 1), shape: [c(0, 0)], nextGateId: `${id}-exit` },
      { id: `${id}-exit`, position: c(6, 1), shape: [c(0, 0)], nextGateId: `${id}-entry` },
    ], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Gate 的推或入由配对端沿输入方向的落点决定。'],
    proposition: '两边任务箱轮流提供远端阻挡：先移动入口释放运输线，再让另一任务布置允许移动出口取得最后推侧。',
    proofConditions: [
      { kind: 'event', event: { key: `event:gate-pushed:${id}-entry` } },
      { kind: 'event', event: { key: `event:gate-pushed:${id}-exit` } },
    ], milestones: [],
    contrastVariable: '只将右侧 Goal 从 (6,3) 改至 (5,2)，取消移开出口取得向下推侧的要求。',
    readabilityElements: ['cell:5,0', 'cell:1,2', 'cell:5,2'],
  },
};
