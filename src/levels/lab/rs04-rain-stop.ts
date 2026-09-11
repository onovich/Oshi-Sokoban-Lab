import type { LevelSpec } from '../../course/types';

const id = 'lab-rs04-still-bank';
const c = (x: number, y: number) => ({ x, y });

export const rainStopPrelude: LevelSpec = {
  id, groupId: 'lab-rain-stop', role: 'establish', cognitiveStage: 'seed',
  prerequisites: ['lesson-36'],
  techniques: [{ techniqueId: 'rain-stop', role: 'primary' }],
  difficulty: { target: 2, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '驻岸', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'rain', player: c(2, 3),
    walls: [c(0,0),c(1,0),c(4,0),c(4,1),c(0,3),c(0,4),c(1,4)],
    terrainGoals: [c(1,2),c(2,2),c(3,4)], terrainSpikes: [],
    blocks: [
      { id: `${id}-b`, position: c(1,2), shape: [c(0,0),c(1,0)], number: 0, isFake: false },
      { id: `${id}-c`, position: c(3,3), shape: [c(0,0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中滑行在障碍前停下，邻接推动仍只走一格。'],
    proposition: '保留横块作为停止边界，经右侧绕行停在小块上方。',
    proofConditions: [], milestones: [],
    contrastVariable: '晴天解除停止边界依赖；停点必要性在真实 move 搜索中过滤对应玩家迁移验证。',
  },
};
