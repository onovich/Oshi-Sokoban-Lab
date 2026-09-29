import type { LevelSpec } from '../../course/types';

const id = 'lab-rs09-alignment-bank';
const c = (x: number, y: number) => ({ x, y });

export const rainAlignment: LevelSpec = {
  id, groupId: 'lab-rain-alignment', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-rs07-release-bank'],
  techniques: [{ techniqueId: 'recoverable-staging-handoff', role: 'primary' }, { techniqueId: 'rain-stop', role: 'support' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '隔汀', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'rain', player: c(0, 1),
    walls: [c(0, 4), c(1, 4)],
    terrainGoals: [c(1, 3), c(3, 4), c(4, 4)], terrainSpikes: [],
    blocks: [
      { id: `${id}-b`, position: c(1, 1), shape: [c(0, 0), c(1, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: c(3, 3), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中滑行在障碍前停止；刚性横块不能旋转；物件只能推动。'],
    proposition: '停点必须对齐后续推侧：横块先下降到小块上方，借它停靠释放小块，再继续下降完成。',
    proofConditions: [{ kind: 'sequence', events: [
      { key: `event:block-pushed:${id}-b:from:3,1:to:3,2` },
      { key: `event:block-pushed:${id}-c:from:3,3:to:2,3` },
    ] }],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,3:to:2,3` } }],
  },
};
