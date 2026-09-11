import type { LevelSpec } from '../../course/types';
import { rainStopPrelude } from './rs04-rain-stop';

const id = 'lab-rs05-borrowed-berth';
export const rainBerth: LevelSpec = {
  id, groupId: 'lab-rain-berth', role: 'establish', cognitiveStage: 'seed',
  prerequisites: ['lesson-36'], techniques: rainStopPrelude.techniques,
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    ...rainStopPrelude.board, id, title: '借泊', player: { x: 2, y: 4 },
    terrainGoals: [{x:3,y:2},{x:4,y:2},{x:3,y:4}],
    blocks: rainStopPrelude.board.blocks.map((block,index)=>({
      ...block,id: `${id}-${index===0?'b':'c'}`,
      position: index===0 ? {x:1,y:3} : {x:3,y:3},
    })),
  },
  theorem: {
    axioms: rainStopPrelude.theorem.axioms,
    proposition: '横块先在非目标位置提供停靠边界，完成小块后再搬去自己的目标。',
    proofConditions: [{kind:'event',event:{key:`event:block-pushed:${id}-b:from:1,3:to:1,2`}}],
    milestones: [],
    contrastVariable: '晴天不再依赖从右侧借横块停住；专用测试过滤该中途迁移。',
  },
};
