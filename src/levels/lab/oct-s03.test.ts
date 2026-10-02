import {expect,it} from 'vitest';
import {octS03} from './oct-s03';
import {solveLevel} from '../../solver/level-solver';
import {createGame,move} from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
it('uses Fake as a rain approach resource without needing reset',()=>{
 const r=solveLevel(octS03,options),safe=solveLevel(octS03,{...options,forbiddenConditions:[{kind:'event',event:{key:'event:object-reset'}},{kind:'event',event:{key:'event:death-reset'}}]});
 expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([11,5]);expect([safe.bestPlan?.moves,safe.bestPlan?.pushes]).toEqual([11,5]);
 let s=createGame(octS03.board);for(const d of r.bestPlan!.directions){const m=move(s,d);expect(m.didMove).toBe(true);s=m.state;}expect(s.status).toBe('won');
});
it('cannot leave Fake fixed unless the single Spike is removed',()=>{
 const forbiddenConditions=octS03.theorem.proofConditions;
 expect(solveLevel(octS03,{...options,forbiddenConditions}).status).toBe('proven-unsolved');
 const r=solveLevel({...octS03,board:{...octS03.board,terrainSpikes:[]}},{...options,forbiddenConditions});expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([8,3]);
});
it('sliding into the upper Spike after Fake preparation loses that preparation',()=>{
 let s=createGame(octS03.board),death;const dirs=['up','right','down','left'] as const;
 for(const l of 'DRUUULUL'){const m=move(s,dirs['URDL'.indexOf(l)]!);expect(m.didMove).toBe(true);s=m.state;death=m.events.find(e=>e.type==='death-reset')??death;}
 expect(death).toBeDefined();expect(s.blocks[1]!.position).toEqual({x:4,y:2});expect(s.player).toEqual({x:1,y:0});
});
