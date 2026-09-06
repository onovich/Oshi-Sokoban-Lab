import type { LevelSpec, ProofEventPattern } from '../../course/types';

const cell = (x: number, y: number) => ({ x, y });
const id = 'lab-e02-return-loan';
const push = (entity: 'a' | 'b' | 'c', from: string, to: string): ProofEventPattern => ({
  key: `event:block-pushed:${id}-${entity}:from:${from}:to:${to}`,
});
const reopenReturn = [
  push('a', '3,1', '2,1'),
  push('c', '2,0', '1,0'),
  push('a', '2,1', '3,1'),
] as const;

/** Experimental transfer of E02's return-access lesson; D5 is not a measured rating. */
export const e02ReturnLoan: LevelSpec = {
  id,
  groupId: 'lab-e02-return-position',
  role: 'transfer',
  cognitiveStage: 'stress',
  prerequisites: ['lab-e02-return-reservation'],
  techniques: [
    { techniqueId: 'return-route-reservation', role: 'primary' },
    { techniqueId: 'recoverable-staging-handoff', role: 'support' },
  ],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id,
    title: '再借庭',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 5,
    height: 5,
    weather: 'clear',
    player: cell(2, 2),
    walls: [cell(4, 0), cell(4, 1), cell(0, 1), cell(0, 2), cell(0, 3), cell(0, 4)],
    terrainGoals: [cell(1, 1), cell(1, 2), cell(1, 0), cell(2, 0), cell(0, 0)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: cell(3, 1), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
      { id: `${id}-b`, position: cell(2, 3), shape: [cell(0, 0), cell(1, 0)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(2, 1), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；刚性形状不可旋转；完整占格参与碰撞和静态 Goal 覆盖。'],
    proposition: '第一次借出中部空间时必须保留南侧返回口；重新让出中部空间后，才能移动横物并再次取回竖物。',
    proofConditions: [{ kind: 'sequence', events: [...reopenReturn, push('b', '2,3', '1,3')] }, {
      kind: 'count', event: push('a', '3,1', '2,1'), atLeast: 2,
    }],
    // A causal preparation checkpoint, not an observed human insight timestamp.
    milestones: [{ kind: 'sequence', events: reopenReturn }],
    contrastVariable: '西侧独立步行返回路；对照禁止物件借用新增格和横物撤回提前左移，并核对相同终局分配。',
  },
};
