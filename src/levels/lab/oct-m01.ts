import type { LevelSpec } from '../../course/types';
const id = 'lab-oct-m01', c = (x: number, y: number) => ({ x, y });
export const octM01: LevelSpec = {
  id, groupId: 'oct-goal', role: 'establish', cognitiveStage: 'reinforce',
  prerequisites: ['lesson-06','lesson-33'],
  techniques: [{ techniqueId: 'goal-mode', role: 'primary' }, { techniqueId: 'whole-footprint', role: 'support' }],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: { id, title: '双埠', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 4, height: 3, weather: 'clear', player: c(3,2), walls: [c(3,0),c(3,1)],
    terrainGoals: [], terrainSpikes: [],
    blocks: [{ id: `${id}-b`, position: c(1,1), shape: [c(0,0),c(1,0)], number: 0, isFake: false }],
    goals: [{ id: `${id}-g`, position: c(1,2), shape: [c(0,0),c(1,0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['可移动 Goal 受阻时可穿；不同组成格同属一个整体；玩家可从整体内部的相邻组成格施推。'],
    proposition: '将整条目标移至受阻位置取得内部站位，再恢复整条覆盖范围，最后从另一侧运入物件。',
    proofConditions: [
      { kind: 'event', event: { key: `event:goal-crossed:${id}-g` } },
      { kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:0,2:to:1,2` } },
    ], milestones: [],
    contrastVariable: '打开右上连通路径 (3,0)、(3,1)，可不移动或穿过 Goal 而直接取得物件上侧。',
    // Supports the plausible but irreversible upward Block push, plus the clean upper bypass contrast.
    readabilityElements: ['cell:2,0'],
  },
};
