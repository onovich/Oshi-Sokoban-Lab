import type { LevelSpec } from '../../course/types';
const c=(x:number,y:number)=>({x,y}),id='lab-oct-s03';
export const octS03: LevelSpec={
  id,groupId:'oct-hazard-rain',role:'transfer',cognitiveStage:'transfer',prerequisites:['lab-rs10-self-stop-bank'],
  techniques:[{techniqueId:'rain-stop',role:'primary'},{techniqueId:'fake-space-resource',role:'support'},{techniqueId:'spike-reset',role:'support'}],
  difficulty:{target:3,confidence:'design-target',sampleSize:0},
  board:{id,title:'侧汀',description:'观察雨中的停点与通路。',objective:'让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width:5,height:5,weather:'rain',player:c(1,0),walls:[],terrainGoals:[c(0,2)],terrainSpikes:[c(2,0)],
    blocks:[{id:`${id}-a`,position:c(2,1),shape:[c(0,0)],number:0,isFake:false},
      {id:`${id}-f`,position:c(4,2),shape:[c(0,0)],number:0,isFake:true}],
    goals:[],gates:[],spikes:[],paths:[]},
  theorem:{axioms:['雨地无邻接物时滑行；邻接物可逐格推移；Fake 不参与胜利但阻挡移动；角色触刺整盘重置。'],
    proposition:'避开危险上沿时，须从另一侧调整 Fake 停点，才能进入真实块的右侧推位。',
    proofConditions:[{kind:'event',event:{key:`event:block-pushed:${id}-f`}}],milestones:[],
    contrastVariable:'仅去掉 (2,0) Spike，上沿直接滑行和原位 Fake 即可提供推侧，无需移动 Fake。'},
};
