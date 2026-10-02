import type {LevelSpec} from '../../course/types';
const id='lab-oct-m03',c=(x:number,y:number)=>({x,y});
export const octM03:LevelSpec={
  id,groupId:'oct-assignment',role:'inference',cognitiveStage:'transfer',prerequisites:['lesson-12','lesson-03'],
  techniques:[{techniqueId:'number-matching',role:'primary'},{techniqueId:'delayed-completion',role:'support'}],
  difficulty:{target:4,confidence:'design-target',sampleSize:0},
  board:{id,title:'错渡',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',width:4,height:3,weather:'clear',player:c(0,2),walls:[c(3,0)],terrainGoals:[],terrainSpikes:[],
    blocks:[{id:`${id}-a`,position:c(1,1),shape:[c(0,0)],number:1,isFake:false},{id:`${id}-b`,position:c(2,1),shape:[c(0,0)],number:2,isFake:false}],
    goals:[{id:`${id}-g1`,position:c(2,2),shape:[c(0,0)],number:1,movable:false},{id:`${id}-g2`,position:c(1,2),shape:[c(0,0)],number:2,movable:false}],gates:[],spikes:[],paths:[]},
  theorem:{axioms:['错号 Goal 不提供完成覆盖，但仍可作为运输暂存格；完成后的物件仍占空间。'],
    proposition:'为了完成交叉的身份分配，先借用错号目标让出通路，再按保留右侧入口的次序收尾。',
    proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:2,1:to:2,2`}}],milestones:[],
    contrastVariable:'仅将两编号 Goal 改为同位置的通配地形 Goal，可各自直推，无需借错号目标运输。'},
};
