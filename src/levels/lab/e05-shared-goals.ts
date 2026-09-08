import type { LevelSpec } from '../../course/types';
import { e04SharedCourt } from './e04-shared-staging';

const id='lab-e05-shared-goals';
export const e05SharedGoals: LevelSpec = {
  ...e04SharedCourt,
  id,
  groupId:'lab-e05-coordination',
  role:'transfer',
  cognitiveStage:'transfer',
  prerequisites:[e04SharedCourt.id],
  difficulty:{target:6,authorRating:8,confidence:'design-target',sampleSize:0},
  board:{
    ...e04SharedCourt.board,id,title:'叠庭',
    terrainGoals:e04SharedCourt.board.terrainGoals.map(p=>p.x===1&&p.y===4 ? {x:0,y:0} : p),
    blocks:e04SharedCourt.board.blocks.map(b=>({...b,id:`${id}-${b.id.slice(-1)}`})),
  },
  theorem:{
    axioms:e04SharedCourt.theorem.axioms,
    proposition:'共享目标区的最终分配必须同时保留物件运输和上方站位，不能逐件就近收尾。',
    proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:1,0:to:0,0`}}],
    milestones:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:1,0:to:0,0`}}],
  },
};
