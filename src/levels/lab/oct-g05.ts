import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-g05';
const c = (x: number, y: number) => ({ x, y });
export const octG05: LevelSpec = {
  id, groupId: 'oct-gate', role: 'inference', cognitiveStage: 'synthesize',
  prerequisites: ['lab-bd3-controlled-entry', 'lesson-06'],
  techniques: [{ techniqueId: 'gate-remote-pushability', role: 'primary' }, { techniqueId: 'complete-footprint', role: 'support' }],
  difficulty: { target: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '横隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 6, height: 4, weather: 'clear', player: c(0, 2), walls: [c(5, 0), c(1, 1), c(0, 0), c(0, 1)],
    terrainGoals: [c(1, 0), c(2, 0)], terrainSpikes: [],
    blocks: [{ id: `${id}-a`, position: c(1, 2), shape: [c(0, 0), c(1, 0)], number: 0, isFake: false }],
    goals: [], gates: [
      { id: `${id}-e`, position: c(3, 1), shape: [c(0, 0)], nextGateId: `${id}-x` },
      { id: `${id}-x`, position: c(4, 1), shape: [c(0, 0)], nextGateId: `${id}-e` },
    ], spikes: [], paths: [],
  }, theorem: {
    axioms: ['物件完整占格都参与 Gate 远端落点阻挡。'],
    proposition: '横块远端组成格既妨碍运输，又是许可移门的控制端；先横向调位制造远端阻挡，再清开向上运输空间。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-x` } }], milestones: [],
    contrastVariable: '只开放 (1,1) 直接向上运输格，可不借横块远端组成格控制移门。',
  },
};
