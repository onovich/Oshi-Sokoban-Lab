import type { LevelSpec } from '../../course/types';
import { e05SharedGoals } from './e05-shared-goals';

const id='lab-e05-return-route';
export const e05ReturnRoute: LevelSpec = {
  ...e05SharedGoals,
  id,
  role:'establish',
  cognitiveStage:'seed',
  prerequisites:['lab-e04-middle-court'],
  difficulty:{target:4,confidence:'design-target',sampleSize:0},
  board:{
    ...e05SharedGoals.board,id,title:'汀庭',width:4,height:6,
    player:{x:3,y:1},
    walls:[{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:0,y:5},{x:1,y:5}],
    terrainGoals:[{x:1,y:0},{x:2,y:0},{x:3,y:4}],
    blocks:[
      {id:`${id}-b`,position:{x:1,y:3},shape:[{x:0,y:0},{x:1,y:0}],number:0,isFake:false},
      {id:`${id}-c`,position:{x:3,y:2},shape:[{x:0,y:0}],number:0,isFake:false},
    ],
  },
  theorem:{
    axioms:e05SharedGoals.theorem.axioms,
    proposition:'靠近终点的物件必须等待暂存物取得回程推侧，才能封闭南侧通路。',
    proofConditions:[{kind:'sequence',events:[
      {key:`event:block-pushed:${id}-b:from:1,3:to:1,4`},
      {key:`event:block-pushed:${id}-b:from:1,4:to:1,3`},
      {key:`event:block-pushed:${id}-c:from:3,3:to:3,4`},
    ]}],
    milestones:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:1,4:to:1,3`}}],
    contrastVariable:'只将单格 Goal 从 (3,4) 移至 (3,0)，即可先完成单格物再取回横物。',
    // Keeps a reversible alternative parking move, not the optimal witness.
    readabilityElements:['cell:3,0'],
  },
};
