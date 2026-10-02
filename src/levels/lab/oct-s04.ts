import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s04';
export const octS04: LevelSpec={
 id,groupId:'oct-hazard-gate',role:'transfer',cognitiveStage:'transfer',prerequisites:['lesson-42'],
 techniques:[{techniqueId:'gate-entry-direction',role:'primary'},{techniqueId:'gate-push-traverse',role:'support'},{techniqueId:'spike-reset',role:'support'}],
 difficulty:{target:4,confidence:'design-target',sampleSize:0},
 board:{id,title:'曲隙',description:'观察两端落点与可站立位置。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
  width:5,height:5,weather:'clear',player:c(0,0),walls:[c(2,0),c(2,1),c(2,3),c(4,3)],
  terrainGoals:[c(2,2)],terrainSpikes:[c(0,3)],
  blocks:[{id:`${id}-a`,position:c(1,3),shape:[c(0,0)],number:0,isFake:false}],goals:[],
  gates:[{id:`${id}-g`,position:c(4,0),shape:[c(0,0)],nextGateId:`${id}-h`},
   {id:`${id}-h`,position:c(0,1),shape:[c(0,0)],nextGateId:`${id}-g`}],spikes:[],paths:[]},
 theorem:{axioms:['Gate 入射方向保留；远端落点受阻时入口可推；角色触刺整盘重置。'],
  proposition:'危险下口不能用于换侧；调整 Gate 后应从横向入口返回，取得物件北侧推位。',
  proofConditions:[{kind:'event',event:{key:'event:gate-traversed:right'}}],milestones:[],
  contrastVariable:'只删除 (0,3) Spike，下口成为普通换侧路，不再需要向右入门返回。'},
};
