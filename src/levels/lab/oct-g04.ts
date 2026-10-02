import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g04';
const c = (x: number, y: number) => ({ x, y });
export const octG04: LevelSpec = {
  id, groupId: 'oct-gate', role: 'inference', cognitiveStage: 'synthesize',
  prerequisites: ['lesson-57', 'lab-bd2-shifted-entry'],
  techniques: [{ techniqueId: 'gate-working-position', role: 'primary' }, { techniqueId: 'rain-stop-placement', role: 'support' }],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '泊隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'rain', player: c(4, 1), walls: [c(4, 3)],
    terrainGoals: [c(1, 0)], terrainSpikes: [],
    blocks: [{ id: `${id}-a`, position: c(2, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [
      { id: `${id}-e`, position: c(2, 0), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(3, 2), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['雨中非邻接动作滑至阻挡前；Gate 的实体位置同时决定阻挡和配对通路。'],
    proposition: '移动 Gate 不只改写传送落点，还要把实体端点布置成雨中停点，以取得箱子的推侧。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-x` } }, { kind: 'event', event: { key: 'event:gate-traversed' } }],
    milestones: [], contrastVariable: '增加 (1,2) 独立静态止挡后，无需由已移动的门提供雨中停点。',
    readabilityElements: ['cell:0,0', 'cell:1,1', 'cell:0,2', 'cell:1,2', 'cell:4,2', 'cell:0,3', 'cell:2,3'],
  },
};
