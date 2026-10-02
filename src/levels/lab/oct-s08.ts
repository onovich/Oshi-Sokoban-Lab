import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s08';
export const octS08: LevelSpec={
 id,groupId:'oct-origin',role:'transfer',cognitiveStage:'transfer',prerequisites:['lesson-42','lab-oct-s05'],
 techniques:[{techniqueId:'spike-reset',role:'primary'},{techniqueId:'origin-loan',role:'primary'}],
 difficulty:{target:4,confidence:'design-target',sampleSize:0},
 board:{id,title:'借扉',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
 width:5,height:5,weather:'clear',player:c(2,1),walls:[c(2,0),c(4,0),c(2,2),c(2,4),c(4,4)],
 terrainGoals:[c(3,0)],terrainSpikes:[c(3,4)],
 blocks:[{id:`${id}-a`,position:c(1,2),shape:[c(0,0)],number:0,isFake:false}],goals:[],
 gates:[{id:`${id}-g`,position:c(4,3),shape:[c(0,0)],nextGateId:`${id}-h`},{id:`${id}-h`,position:c(1,3),shape:[c(0,0)],nextGateId:`${id}-g`}],spikes:[],paths:[]},
 theorem:{axioms:['Gate 回位不能覆盖 Block；触刺不重置玩家站位。'],
 proposition:'Gate 暂离原点供 Block 通过，原点归还后 Gate 先回位，随后 Block 借同一 Spike 回位换侧。',
 proofConditions:[{kind:'event',event:{key:`event:object-reset:gate:${id}-h`}},{kind:'event',event:{key:`event:block-pushed:${id}-a:from:1,2:to:1,3`}},{kind:'sequence',events:[{key:`event:object-reset:gate:${id}-h`},{key:`event:object-reset:block:${id}-a`}]}],milestones:[],
 contrastVariable:'仅开放 (2,0) 北侧通道，不再借 Gate 原点或触刺。'},
};
