import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s06';
export const octS06: LevelSpec={
 id,groupId:'oct-origin',role:'transfer',cognitiveStage:'transfer',prerequisites:['lesson-33','lesson-24'],
 techniques:[{techniqueId:'spike-reset',role:'primary'},{techniqueId:'movable-goal-staging',role:'primary'}],
 difficulty:{target:3,confidence:'design-target',sampleSize:0},
 board:{id,title:'回桁',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
 width:5,height:5,weather:'clear',player:c(2,0),walls:[c(0,1),c(2,1),c(4,1),c(1,3),c(0,0),c(4,0),c(4,3),c(4,4)],terrainGoals:[],terrainSpikes:[c(3,0)],
 blocks:[{id:`${id}-a`,position:c(2,4),shape:[c(0,0)],number:0,isFake:false}],
 goals:[{id:`${id}-g`,position:c(3,2),shape:[c(0,0)],number:0,movable:true}],gates:[],spikes:[],paths:[]},
 theorem:{axioms:['可移动 Goal 触刺回到其出生位置；回位保留玩家站位。'],
 proposition:'Goal 先朝相反方向触刺，取得其上侧后再将目标运往 Block 可达的底行。',
 proofConditions:[{kind:'event',event:{key:`event:object-reset:goal:${id}-g`}}],milestones:[],
 contrastVariable:'仅开放 (2,1)，可经北侧直接改变 Goal 的运输方向。'},
};
