import type { LevelSpec, ProofCondition } from '../../course/types';

const id = 'lab-gc01-goal-return';
const cell = (x: number, y: number) => ({ x, y });
const moveGoalAside: ProofCondition = {
  kind: 'event', event: { key: `event:goal-pushed:${id}-g:from:0,2:to:0,3` },
};
const reopenReturn: ProofCondition = {
  kind: 'event', event: { key: `event:block-pushed:${id}-b:from:3,2:to:3,1` },
};

/** GC01 coordination variant, not proof of the original early-clearing hypothesis. */
export const gc01GoalReturn: LevelSpec = {
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
  difficulty: { target: 5, authorRating: 7, confidence: 'playtest-provisional', sampleSize: 0 },
  board: {
    id,
    title: '涉岸',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5,
    height: 4,
    weather: 'clear',
    player: cell(0, 2),
    walls: [cell(3, 0), cell(4, 0), cell(1, 1), cell(1, 3), cell(2, 3)],
    terrainGoals: [cell(3, 2)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-b`, position: cell(2, 2), shape: [cell(0, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(2, 1), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [{ id: `${id}-g`, position: cell(1, 2), shape: [cell(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；Goal 可推时移动，受阻时可穿过；玩家不参与目标覆盖。'],
    proposition: 'Goal 的最终位置与箱子的暂时完成都须保留回程；必须先改造目标落点，并撤回局部完成来运输另一箱。',
    proofConditions: [moveGoalAside, reopenReturn, {
      kind: 'event', event: { key: `event:goal-crossed:${id}-g` },
    }],
    // A verified execution-tail witness, not a claim about the player's insight time.
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-c:from:0,2:to:0,3` } }],
    contrastVariable: '打开 (1,1) 独立回程后，Goal 无须从 (0,2) 下移到 (0,3)。',
  },
};
