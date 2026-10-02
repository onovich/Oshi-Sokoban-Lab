import type{LevelSpec}from'../../course/types';
const id='lab-oct-m04',c=(x:number,y:number)=>({x,y});
export const octM04:LevelSpec={
 id,groupId:'oct-rain',role:'inference',cognitiveStage:'transfer',prerequisites:['lesson-18','lesson-36'],
 techniques:[{techniqueId:'rain-stop-programming',role:'primary'},{techniqueId:'fake-resource',role:'support'}],
 difficulty:{target:5,confidence:'design-target',sampleSize:0},
 board:{id,title:'两汀',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',width:4,height:4,weather:'rain',player:c(0,1),walls:[c(0,0),c(3,0),c(0,3)],terrainGoals:[c(2,0)],terrainSpikes:[],
 blocks:[{id:`${id}-a`,position:c(2,2),shape:[c(0,0)],number:0,isFake:false},{id:`${id}-f`,position:c(1,2),shape:[c(0,0)],number:0,isFake:true}],goals:[],gates:[],spikes:[],paths:[]},
 theorem:{axioms:['Fake 不参与胜利但仍提供雨中停止点；雨中滑行不能自行选择中途停下。'],
 proposition:'同一 Fake 先为上方访问提供停点，再移到底部为真实物件的最终推侧提供停点；仅将障碍清走不足以完成。',
 proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-f:from:1,2:to:1,1`}},{kind:'event',event:{key:`event:block-pushed:${id}-f:from:1,2:to:1,3`}}],milestones:[],
 readabilityElements:['cell:0,2'],contrastVariable:'将 (1,3) 空格改为固定 Wall，直接提供下侧停点，不再需要调度 Fake；晴天则可自行走到下侧。'},
};
