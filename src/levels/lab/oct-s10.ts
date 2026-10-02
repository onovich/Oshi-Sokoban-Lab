import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s10';
export const octS10: LevelSpec={
 id,groupId:'oct-origin',role:'transfer',cognitiveStage:'transfer',prerequisites:['lab-rs10-self-stop-bank','lab-oct-s09'],
 techniques:[{techniqueId:'spike-reset',role:'primary'},{techniqueId:'rain-stop',role:'primary'},{techniqueId:'fake-space-resource',role:'support'}],
 difficulty:{target:4,confidence:'design-target',sampleSize:0},
 board:{id,title:'再汀',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
 width:5,height:5,weather:'rain',player:c(0,4),walls:[c(1,1),c(4,1),c(3,4),c(0,0),c(4,0),c(0,1),c(0,3),c(1,3)],terrainGoals:[c(0,2)],terrainSpikes:[c(1,0)],
 blocks:[{id:`${id}-a`,position:c(3,2),shape:[c(0,0)],number:0,isFake:false},{id:`${id}-f`,position:c(2,1),shape:[c(0,0)],number:0,isFake:true}],goals:[],gates:[],spikes:[],paths:[]},
 theorem:{axioms:['Fake 回位后仍可继续推动，Rain 站位随空间资源改变。'],
 proposition:'先把 Fake 推离出生点并触刺回收，再从新侧推动它取得中间行的出入口，最后运送真实 Block。',
 proofConditions:[{kind:'event',event:{key:`event:object-reset:block:${id}-f`}},{kind:'sequence',events:[{key:`event:object-reset:block:${id}-f`},{key:`event:block-pushed:${id}-f`}]}],milestones:[],
 contrastVariable:'仅开放 (3,4)，底边独立滑行口直接提供右侧运输站位。'},
};
