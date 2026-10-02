import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g10', c = (x: number, y: number) => ({ x, y });
export const octG10: LevelSpec = {
  id, groupId: 'oct-gate', role: 'synthesis', cognitiveStage: 'synthesize', prerequisites: ['lab-oct-g01', 'lesson-63'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }, { techniqueId: 'spike-origin-reset', role: 'support' }],
  difficulty: { target: 8, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '溯隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 6, height: 4, weather: 'clear', player: c(5, 0), walls: [c(1, 2), c(4, 3), c(5, 2), c(5, 3)],
    terrainGoals: [c(0, 2)], terrainSpikes: [c(2, 0)],
    blocks: [{ id: `${id}-a`, position: c(4, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [
      { id: `${id}-e`, position: c(1, 3), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(1, 1), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['Block 回位不会撤销此前的 Gate 布置。'],
    proposition: '箱子先作为远端阻挡许可调门，再回位回收箱子而保留已准备的门路；两项机制不独立完成。',
    proofConditions: [{ kind: 'event', event: { key: `event:object-reset:block:${id}-a` } }], milestones: [],
  },
};
