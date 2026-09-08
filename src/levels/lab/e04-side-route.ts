import type { LevelSpec } from '../../course/types';
import { e04UpperRoute } from './e04-upper-route';

const id='lab-e04-side-route';
export const e04SideRoute: LevelSpec = {
  ...e04UpperRoute,
  id,
  role:'boundary',
  cognitiveStage:'transfer',
  prerequisites:[e04UpperRoute.id],
  difficulty:{target:3,authorRating:2,confidence:'design-target',sampleSize:0},
  board:{
    ...e04UpperRoute.board,id,title:'侧隅',
    walls:[{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:2,y:3},{x:3,y:3}],
    blocks:e04UpperRoute.board.blocks.map(b=>({...b,id:`${id}-${b.id.slice(-1)}`})),
  },
  theorem:{
    axioms:e04UpperRoute.theorem.axioms,
    proposition:'上方站位仍须取得，但侧面绕行口改变了获取方式，横物不必一律延迟完成。',
    // This is an intermediate placement, not the last goal-covering push.
    // Actual player access is checked separately through the spatial oracle.
    proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-a:from:3,1:to:4,1`}}],
    milestones:[{kind:'event',event:{key:`event:block-pushed:${id}-a:from:3,1:to:4,1`}}],
    contrastVariable:'与隅庭相比改换上方访问路线；不是只改一格的对照。',
  },
};
