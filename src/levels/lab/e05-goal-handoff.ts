import type { LevelSpec } from '../../course/types';
import { e05SharedGoals } from './e05-shared-goals';

const id='lab-e05-goal-handoff';
export const e05GoalHandoff: LevelSpec = {
  ...e05SharedGoals,id,
  role:'establish',cognitiveStage:'seed',
  prerequisites:['lab-e05-return-route'],
  difficulty:{target:3,confidence:'design-target',sampleSize:0},
  board:{
    ...e05SharedGoals.board,id,title:'并庭',width:4,height:4,
    player:{x:1,y:2},
    walls:[{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:1,y:3}],
    terrainGoals:[{x:0,y:0},{x:1,y:0},{x:2,y:0}],
    blocks:[
      {id:`${id}-b`,position:{x:1,y:1},shape:[{x:0,y:0},{x:1,y:0}],number:0,isFake:false},
      {id:`${id}-c`,position:{x:2,y:2},shape:[{x:0,y:0}],number:0,isFake:false},
    ],
  },
  theorem:{
    axioms:e05SharedGoals.theorem.axioms,
    proposition:'完成横物后仍须调整它在目标区的位置，为另一物件留下可到达的目标。',
    proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:1,0:to:0,0`}}],
    milestones:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:1,0:to:0,0`}}],
    contrastVariable:'只把左端 Goal 移至 (3,0)，已完成横物不再需要移动。',
  },
};
