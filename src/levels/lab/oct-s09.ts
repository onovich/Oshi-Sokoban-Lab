import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s09';
export const octS09: LevelSpec={
 id,groupId:'oct-origin',role:'transfer',cognitiveStage:'transfer',prerequisites:['lab-rs10-self-stop-bank','lab-oct-s03'],
 techniques:[{techniqueId:'spike-reset',role:'primary'},{techniqueId:'rain-stop',role:'primary'},{techniqueId:'fake-space-resource',role:'support'}],
 difficulty:{target:3,confidence:'design-target',sampleSize:0},
 board:{id,title:'返汀',description:'先观察物件、目标与可站立位置，再决定第一步。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
 width:5,height:5,weather:'rain',player:c(3,0),walls:[c(2,0),c(4,0)],terrainGoals:[c(4,4)],terrainSpikes:[c(3,4)],
 blocks:[{id:`${id}-a`,position:c(3,3),shape:[c(0,0)],number:0,isFake:false},{id:`${id}-f`,position:c(1,4),shape:[c(0,0)],number:0,isFake:true}],goals:[],gates:[],spikes:[],paths:[]},
 theorem:{axioms:['Rain 改变停位；Fake 可推动并触刺回位但不需要上 Goal。'],
 proposition:'先借 Fake 所在列停止取得横推侧，再将它触刺回位，留下玩家在另一列以取得最终下推侧。',
 proofConditions:[{kind:'event',event:{key:`event:object-reset:block:${id}-f`}}],milestones:[],
 contrastVariable:'仅开放 (4,0) 北口，直接沿右侧取得下推站位。'},
};
