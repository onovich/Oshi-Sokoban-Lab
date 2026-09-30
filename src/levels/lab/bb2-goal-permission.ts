import type { LevelSpec } from '../../course/types';
const id = 'lab-bb2-goal-permission';
const c = (x: number, y: number) => ({ x, y });

export const bb2GoalPermission: LevelSpec = {
  id, groupId: 'batch-b-workspace', role: 'inference', cognitiveStage: 'transfer',
  prerequisites: ['lab-bb1-goal-workspace', 'lesson-33'],
  techniques: [{ techniqueId: 'goal-mode', role: 'primary' }],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '借埠', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 4, height: 4, weather: 'clear', player: c(2, 1),
    walls: [c(2, 0), c(3, 0), c(3, 2), c(3, 3), c(0, 3)],
    terrainGoals: [c(1, 3)], terrainSpikes: [],
    blocks: [c(1, 2), c(0, 1)].map((position, index) => ({
      id: `${id}-b${index}`, position, shape: [c(0, 0)], number: 0, isFake: false,
    })),
    goals: [{ id: `${id}-g`, position: c(2, 2), shape: [c(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['晴天 Goal 能推则推，受阻时可穿过；改变位置与接近方向会改变该次输入的许可。'],
    proposition: '把同一个 Goal 借作通路：先移至墙边，再靠上箱子穿过，从另一侧将其送到最终落点。',
    proofConditions: [
      { kind: 'event', event: { key: 'event:goal-pushed' } },
      { kind: 'event', event: { key: 'event:goal-crossed' } },
    ],
    milestones: [],
    contrastVariable: '开放 (3,2) 右侧绕行口，解除依靠箱子阻挡 Goal 再穿过的必要性。',
  },
};
