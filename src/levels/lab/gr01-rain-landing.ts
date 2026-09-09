import type { LevelSpec } from '../../course/types';

const id = 'lab-gr01-rain-landing';
const cell = (x: number, y: number) => ({ x, y });

export const gr01RainLanding: LevelSpec = {
  id, groupId: 'lab-goal-rain', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-gc03-goal-handoff', 'lesson-36', 'lesson-39'],
  techniques: [
    { techniqueId: 'rain-stop', role: 'primary' },
    { techniqueId: 'goal-mode', role: 'support' },
    { techniqueId: 'return-route-reservation', role: 'support' },
  ],
  difficulty: { target: 5, authorRating: 6, confidence: 'playtest-provisional', sampleSize: 0 },
  board: {
    id, title: '雨岸',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'rain', player: cell(0, 2),
    walls: [cell(3, 0), cell(4, 0), cell(0, 3), cell(1, 3), cell(2, 3)],
    terrainGoals: [cell(3, 2)], terrainSpikes: [],
    blocks: [
      { id: `${id}-b`, position: cell(1, 1), shape: [cell(0, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(3, 2), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [{ id: `${id}-g`, position: cell(1, 2), shape: [cell(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['雨中空旷输入滑至阻挡前；邻接箱子或可推动 Goal 时执行一步推动；Goal 参与停止与胜利。'],
    proposition: '直接推侧无法停下时，先用 Goal 建立侧向入射所需停点，再绕运上箱；目标落位同时决定运输方式。',
    proofConditions: [
      { kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:1,2:to:0,2` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-b:from:1,1:to:2,1` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-b:from:2,1:to:2,2` } },
    ],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,2:to:3,1` } }],
    contrastVariable: '在 (2,0) 加墙提供直接推侧的停止边界，或仅改晴天，均解除 Goal 停点准备与绕运要求。',
  },
};
