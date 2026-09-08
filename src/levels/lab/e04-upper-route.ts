import type { LevelSpec } from '../../course/types';
import { e04SharedCourt } from './e04-shared-staging';

const id='lab-e04-upper-route';
/** Isolates the author's observed premature horizontal completion, without C. */
export const e04UpperRoute: LevelSpec = {
  ...e04SharedCourt,
  id,
  role:'establish',
  cognitiveStage:'seed',
  prerequisites:['lab-e04-small-court'],
  difficulty:{target:3,authorRating:4,confidence:'design-target',sampleSize:0},
  board:{
    ...e04SharedCourt.board, id, title:'隅庭', height:4,
    player:{x:1,y:3},
    walls:[...e04SharedCourt.board.walls.filter(p=>p.y<4 && (p.x!==0 || p.y!==2)),{x:2,y:3}],
    terrainGoals:e04SharedCourt.board.terrainGoals.filter(p=>p.y<4),
    blocks:[
      {...e04SharedCourt.board.blocks[0]!,id:`${id}-a`,position:{x:3,y:1}},
      {...e04SharedCourt.board.blocks[1]!,id:`${id}-b`,position:{x:1,y:2}},
    ],
  },
  theorem:{
    axioms:e04SharedCourt.theorem.axioms,
    proposition:'竖物虽然已在右侧，仍需要上方通路取得下推站位，横物不能提前封住它。',
    proofConditions:[{kind:'sequence',events:[
      {key:`event:block-pushed:${id}-a:from:3,1:to:3,2`},
      {key:`event:block-pushed:${id}-b`},
    ]}],
    milestones:[{kind:'event',event:{key:`event:block-pushed:${id}-a:from:3,1:to:3,2`}}],
    contrastVariable:'右端增加独立绕行口 (4,0)、(4,1)，横物提前归位不再封死上方通路。',
  },
};
