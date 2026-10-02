import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g08', c = (x: number, y: number) => ({ x, y });
export const octG08: LevelSpec = {
  id, groupId: 'oct-gate', role: 'synthesis', cognitiveStage: 'synthesize', prerequisites: ['lab-oct-g02', 'lesson-15'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }, { techniqueId: 'goal-allocation', role: 'support' }],
  difficulty: { target: 7, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '栖隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(0, 0), walls: [c(3, 0), c(4, 0), c(0, 3)],
    terrainGoals: [c(2, 3), c(2, 0)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(3, 1), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(1, 1), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [
      { id: `${id}-e`, position: c(2, 2), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(1, 0), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['Gate 可暂占 Goal，但真实 Block 完成时必须释放目标占格。'],
    proposition: '目标格必须先借给门作为实际入口取得推侧，再把入口移走归还给真实箱子；暂占不是单纯路过。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-e` } }], milestones: [],
  },
};
