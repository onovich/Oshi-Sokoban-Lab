import type{LevelSpec}from'../../course/types';
const id='lab-oct-m05',c=(x:number,y:number)=>({x,y});
export const octM05:LevelSpec={
 id,groupId:'oct-rain',role:'synthesis',cognitiveStage:'synthesize',prerequisites:['lesson-36','lesson-30'],
 techniques:[{techniqueId:'rain-stop-programming',role:'primary'},{techniqueId:'movable-goal-routing',role:'support'}],
 difficulty:{target:5,confidence:'design-target',sampleSize:0},
 board:{id,title:'叠汀',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',width:4,height:4,weather:'rain',player:c(0,1),walls:[c(0,0),c(0,3),c(3,3)],terrainGoals:[c(1,3)],terrainSpikes:[],
 blocks:[{id:`${id}-a`,position:c(2,0),shape:[c(0,0)],number:0,isFake:false},{id:`${id}-b`,position:c(2,2),shape:[c(0,0)],number:0,isFake:false}],goals:[{id:`${id}-g`,position:c(1,1),shape:[c(0,0)],number:0,movable:true}],gates:[],spikes:[],paths:[]},
 theorem:{axioms:['雨中物件可充当停止点；可移动 Goal 的最终位置须与运输及站位共同安排。'],
 proposition:'下方任务物先远离自己的目标成为上方停点；上方任务物的位置安排又限制它的回推侧，必须协调两项运输而非逐件直达。',
 proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-b:from:2,2:to:2,1`}},{kind:'event',event:{key:`event:goal-pushed:${id}-g:from:2,1:to:3,1`}}],milestones:[],
 contrastVariable:'仅改为晴天，可以直接获得上方站位而不先将 B 上移。'},
};
