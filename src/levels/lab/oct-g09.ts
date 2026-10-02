import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g09', c = (x: number, y: number) => ({ x, y });
export const octG09: LevelSpec = {
  id, groupId: 'oct-gate', role: 'synthesis', cognitiveStage: 'synthesize', prerequisites: ['lab-oct-g04', 'lesson-57'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }, { techniqueId: 'rain-stopping-point', role: 'support' }],
  difficulty: { target: 7, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '截隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'rain', player: c(0, 0), walls: [c(2, 0), c(3, 3), c(4, 3)],
    terrainGoals: [c(1, 0)], terrainSpikes: [],
    blocks: [{ id: `${id}-a`, position: c(2, 2), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [
      { id: `${id}-e`, position: c(1, 1), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(2, 1), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['雨中 Gate 的远端通行条件也决定能否在门前停止。'],
    proposition: '箱子先挡住远端落点，把本地门从通路变成雨中停止器，取得中途站位后才能继续调门和运箱。',
    proofConditions: [{ kind: 'event', event: { key: 'event:rain-slid' } }], milestones: [],
  },
};
