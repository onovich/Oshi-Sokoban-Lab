import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s07';
export const octS07: LevelSpec={
 id,groupId:'oct-origin',role:'transfer',cognitiveStage:'transfer',prerequisites:['lesson-24','lesson-06'],
 techniques:[{techniqueId:'spike-reset',role:'primary'},{techniqueId:'whole-footprint',role:'primary'}],
 difficulty:{target:3,confidence:'design-target',sampleSize:0},
 board:{id,title:'远原',description:'观察整块形状与边侧空间。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
  width:5,height:5,weather:'clear',player:c(2,2),walls:[c(0,0),c(3,0),c(1,2),c(0,3),c(1,0),c(2,0),c(4,0),c(0,2),c(4,3),c(0,4)],
  terrainGoals:[c(0,1),c(1,1)],terrainSpikes:[c(4,4)],
  blocks:[{id:`${id}-a`,position:c(2,3),shape:[c(0,0),c(1,0)],number:0,isFake:false}],goals:[],gates:[],spikes:[],paths:[]},
 theorem:{axioms:['任一组成格触刺使整块回位；玩家保留触发后的站位。'],
  proposition:'将横条送入边侧，让远端触刺整块回位，玩家借此留在北向运输所需的下推侧。',
  proofConditions:[{kind:'event',event:{key:`event:object-reset:block:${id}-a`}}],milestones:[],
  contrastVariable:'仅开放 (1,2) 独立绕行口，玩家不借触刺也能取得横条下侧。'},
};
