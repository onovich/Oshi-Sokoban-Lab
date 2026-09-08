import type { LevelSpec } from '../../course/types';
import { e03Alcove } from './e03-goal-space';

const id = 'lab-e03-west-court';

/** Same target pattern, but the player's access route has changed. */
export const e03WestCourt: LevelSpec = {
  ...e03Alcove,
  id,
  role: 'boundary',
  cognitiveStage: 'overturn',
  prerequisites: ['lab-e03-side-court'],
  techniques: [{ techniqueId: 'goal-allocation-from-access', role: 'primary' }],
  difficulty: { target: 3, authorRating: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...e03Alcove.board,
    id,
    title: '西庭',
    walls: [...e03Alcove.board.walls.filter(p => p.x !== 0), { x: 3, y: 0 }],
    blocks: e03Alcove.board.blocks.map(b => ({ ...b, id: `${id}-${b.id.slice(-1)}` })),
  },
  theorem: {
    axioms: e03Alcove.theorem.axioms,
    proposition: 'Goal 是否需要留空取决于推动站位与到达路径；改走西侧后，近 Goal 可以成为最终位置。',
    proofConditions: [{ kind: 'event', event: { key: `event:block-pushed:${id}-a:from:2,1:to:1,1` } }],
    milestones: [{ kind: 'event', event: { key: `event:block-pushed:${id}-a:from:2,1:to:1,1` } }],
    contrastVariable: '上方入口关闭、西侧绕行打开；目标、物体形状与初始位置不变。',
    readabilityElements: ['terrain-goal:0,0'],
  },
};
