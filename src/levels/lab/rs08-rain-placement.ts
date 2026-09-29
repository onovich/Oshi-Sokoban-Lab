import type { LevelSpec } from '../../course/types';

const id = 'lab-rs08-placement-bank';
const c = (x: number, y: number) => ({ x, y });

export const rainPlacement: LevelSpec = {
  id, groupId: 'lab-rain-placement', role: 'boundary', cognitiveStage: 'reinforce',
  prerequisites: ['lab-rs07-release-bank'],
  techniques: [{ techniqueId: 'recoverable-staging-handoff', role: 'primary' }, { techniqueId: 'rain-stop', role: 'support' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '择汀', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 6, height: 4, weather: 'rain', player: c(0, 1),
    walls: [c(0, 3), c(1, 3), c(5, 0), c(5, 2), c(5, 3)],
    terrainGoals: [c(1, 2), c(3, 3), c(4, 3)], terrainSpikes: [],
    blocks: [
      { id: `${id}-b`, position: c(1, 1), shape: [c(0, 0), c(1, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: c(3, 2), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中滑行在障碍前停止；刚性横块不能旋转；物件只能推动。'],
    proposition: '横块的暂存位置由移出小块所需的站位决定，不能只追求向边界推到底。',
    proofConditions: [{ kind: 'sequence', events: [
      { key: `event:block-pushed:${id}-b:from:2,1:to:3,1` },
      { key: `event:block-pushed:${id}-c:from:3,2:to:2,2` },
    ] }],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,2:to:2,2` } }],
  },
};
