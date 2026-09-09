import type { LevelSpec } from '../../course/types';

const id = 'lab-gc03-goal-handoff';
const cell = (x: number, y: number) => ({ x, y });

export const gc03GoalHandoff: LevelSpec = {
  id,
  groupId: 'lab-goal-coordination',
  role: 'transfer',
  cognitiveStage: 'transfer',
  prerequisites: ['lab-e02-return-loan', 'lesson-33'],
  techniques: [
    { techniqueId: 'goal-mode', role: 'primary' },
    { techniqueId: 'return-route-reservation', role: 'support' },
    { techniqueId: 'delayed-completion', role: 'support' },
  ],
  difficulty: { target: 5, authorRating: 6, confidence: 'playtest-provisional', sampleSize: 0 },
  board: {
    id, title: '转岸',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 4, weather: 'clear', player: cell(0, 2),
    walls: [cell(0, 0), cell(3, 0), cell(4, 0), cell(0, 1), cell(0, 3), cell(1, 3), cell(2, 3)],
    terrainGoals: [cell(3, 2)], terrainSpikes: [],
    blocks: [
      { id: `${id}-b`, position: cell(1, 1), shape: [cell(0, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(3, 2), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [{ id: `${id}-g`, position: cell(1, 2), shape: [cell(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；Goal 可推时移动，受阻时可穿过；玩家不参与目标覆盖。'],
    proposition: '先借出 Goal 所占通路，再撤回已完成箱子以取回 Goal；上箱下运不能过早占住 Goal 的返回位置。',
    proofConditions: [
      { kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:1,2:to:2,2` } },
      { kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:2,2:to:1,2` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-c:from:3,2:to:3,1` } },
    ],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-b:from:1,1:to:1,2` } }],
    contrastVariable: '打开 (0,0) 与 (0,1) 的独立进入路径后可直接完成上方箱子，不必搬动 Goal 或撤回右箱。',
  },
};
