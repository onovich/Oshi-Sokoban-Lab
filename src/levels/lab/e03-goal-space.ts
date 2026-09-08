import type { LevelSpec, ProofEventPattern } from '../../course/types';

const cell = (x: number, y: number) => ({ x, y });
const groupId = 'lab-e03-goal-space';

function candidate(id: string, withHorizontal: boolean): LevelSpec {
  const push = (entity: string, from: string, to: string): ProofEventPattern => ({
    key: `event:block-pushed:${id}-${entity}:from:${from}:to:${to}`,
  });
  const release = {
    kind: 'sequence' as const,
    events: [push('c', '2,1', '2,0'), push('c', '2,0', '1,0')],
  };
  return {
    id, groupId,
    role: withHorizontal ? 'transfer' : 'establish',
    cognitiveStage: withHorizontal ? 'transfer' : 'reinforce',
    prerequisites: withHorizontal ? ['lab-e03-alcove'] : ['lab-e02-return-loan'],
    techniques: [
      { techniqueId: 'temporary-goal-release', role: 'primary' },
      { techniqueId: 'return-route-reservation', role: 'support' },
    ],
    difficulty: { target: withHorizontal ? 5 : 4, confidence: 'design-target', sampleSize: 0 },
    board: {
      id,
      title: withHorizontal ? '偏庭' : '小庭',
      description: '先观察物件、目标与可站立位置，再决定第一步。',
      objective: '让所有真实 Block 的每一格都覆盖 Goal。',
      width: 5, height: withHorizontal ? 5 : 4, weather: 'clear',
      player: cell(2, 2),
      walls: [cell(4, 0), cell(4, 1), cell(0, 1), cell(0, 2), cell(0, 3),
        ...(withHorizontal ? [cell(0, 4)] : [])],
      terrainGoals: [cell(0, 0), cell(2, 0), cell(1, 2), cell(1, 3),
        ...(withHorizontal ? [cell(3, 2), cell(4, 2)] : [])],
      terrainSpikes: [],
      blocks: [
        { id: `${id}-a`, position: cell(3, 1), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
        { id: `${id}-c`, position: cell(2, 1), shape: [cell(0, 0)], number: 0, isFake: false },
        ...(withHorizontal ? [{ id: `${id}-b`, position: cell(2, 3), shape: [cell(0, 0), cell(1, 0)], number: 0, isFake: false }] : []),
      ],
      goals: [], gates: [], spikes: [], paths: [],
    },
    theorem: {
      axioms: ['普通推动、不可旋转形状、完整占格；静态通配 Goal 不改变碰撞，允许空 Goal。'],
      proposition: withHorizontal
        ? '暂时完成单格物只是准备；必须释放上方推侧，并协调横物的返回站位，才能确定最终分配。'
        : '单格物必须先借用近 Goal，让竖物让路，再离开近 Goal，释放竖物收尾所需的上方通路。',
      proofConditions: [release, ...(withHorizontal ? [{
        kind: 'sequence' as const,
        events: [push('a', '3,1', '2,1'), push('b', '2,3', '3,3'), push('b', '3,3', '3,2')],
      }] : [])],
      milestones: [release],
      contrastVariable: '西侧独立玩家绕行口；保持目标集合与物件不变。',
      readabilityElements: ['terrain-goal:2,0'],
    },
  };
}

export const e03Alcove = candidate('lab-e03-alcove', false);
export const e03SideCourt = candidate('lab-e03-side-court', true);
export const e03GoalSpaceLevels: readonly LevelSpec[] = [e03Alcove, e03SideCourt];
