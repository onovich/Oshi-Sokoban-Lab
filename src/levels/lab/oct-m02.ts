import type { LevelSpec } from '../../course/types';
const id='lab-oct-m02',c=(x:number,y:number)=>({x,y});
export const octM02: LevelSpec={
  id,groupId:'oct-goal',role:'inference',cognitiveStage:'transfer',prerequisites:['lesson-33'],
  techniques:[{techniqueId:'goal-mode',role:'primary'},{techniqueId:'temporary-blocker',role:'support'}],
  difficulty:{target:4,confidence:'design-target',sampleSize:0},
  board:{id,title:'倚埠',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width:4,height:3,weather:'clear',player:c(0,1),walls:[c(0,0),c(0,2),c(3,2)],terrainGoals:[],terrainSpikes:[],
    blocks:[{id:`${id}-b`,position:c(2,0),shape:[c(0,0)],number:0,isFake:false}],
    goals:[{id:`${id}-g`,position:c(1,1),shape:[c(0,0)],number:0,movable:true}],gates:[],spikes:[],paths:[]},
  theorem:{axioms:['Goal 受阻时可穿过；真实 Block 既可阻挡 Goal 又需最终完成覆盖。'],
    proposition:'先将 Goal 安排在任务物件下方借阻挡穿过，再从新侧回收 Goal 并送到任务物件可到达的位置。',
    proofConditions:[{kind:'event',event:{key:`event:goal-crossed:${id}-g`}},
      {kind:'event',event:{key:`event:goal-pushed:${id}-g:from:2,1:to:1,1`}}],milestones:[],
    contrastVariable:'打开 (3,2) 下侧通路，不依靠 Block 阻挡 Goal 即可到达另一侧。'},
};
