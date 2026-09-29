import type { LevelSpec } from '../../course/types';

const id = 'lab-rs10-self-stop-bank';
const c = (x: number, y: number) => ({ x, y });

export const rainSelfStop: LevelSpec = {
  id, groupId: 'lab-rain-self-stop', role: 'establish', cognitiveStage: 'seed',
  prerequisites: ['lesson-36'],
  techniques: [{ techniqueId: 'rain-stop', role: 'primary' }],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '寻汀', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'rain', player: c(3, 1),
    walls: [c(0, 0), c(1, 0), c(4, 0), c(4, 1), c(0, 3), c(1, 3), c(0, 4), c(1, 4)],
    terrainGoals: [c(4, 2)], terrainSpikes: [],
    blocks: [{ id: `${id}-c`, position: c(2, 3), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中玩家在障碍前停止；邻接推动只移动一格。'],
    proposition: '待推动的小块本身可以提供绕到自身另一侧的停点，不一定需要另一件物品。',
    // The one-cell approach emits no rain-slid event. Its necessity is checked
    // separately by a real-move graph test, not inferred from this push alone.
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:2,3:to:2,2` } }],
    milestones: [],
    contrastVariable: '晴天可逐格步行进入推侧，不再依赖沿滑行方向借小块停靠；具体停靠方向不强制。',
  },
};
