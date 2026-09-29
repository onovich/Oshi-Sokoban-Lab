import type { LevelSpec } from '../../course/types';

const id = 'lab-bb1-goal-workspace';
const c = (x: number, y: number) => ({ x, y });

export const bb1GoalWorkspace: LevelSpec = {
  id, groupId: 'batch-b-workspace', role: 'practice', cognitiveStage: 'reinforce',
  prerequisites: ['lesson-33'],
  techniques: [{ techniqueId: 'goal-mode', role: 'primary' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '回埠', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: c(4, 2),
    walls: [c(4, 0), c(4, 1), c(1, 3), c(2, 3), c(4, 3), c(1, 0), c(0, 3), c(0, 0)],
    terrainGoals: [], terrainSpikes: [],
    blocks: [{ id: `${id}-b`, position: c(3, 1), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [{ id: `${id}-g`, position: c(3, 2), shape: [c(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；Goal 能推则推，被阻挡时允许玩家穿过；玩家不参与目标覆盖。'],
    proposition: 'Goal 只挪一格仍占据所需站位；必须继续移到工作位置，绕至回收侧后恢复落点，再完成 Block。',
    proofConditions: [
      { kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:2,2:to:1,2` } },
      { kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:1,2:to:2,2` } },
    ],
    milestones: [],
    contrastVariable: '仅开放 (4,3) 独立侧路，可不移动 Goal 取得 Block 推侧；取消越位与回收。',
    readabilityElements: ['cell:0,1', 'cell:3,3'],
  },
};
