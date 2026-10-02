import {expect,it} from 'vitest';
import {octS04} from './oct-s04';
import {solveLevel} from '../../solver/level-solver';
import {createGame,move} from '../../engine/game-engine';
const options={maximumStates:80000,maximumPlans:1,pushSlack:0,moveSlack:0};
it('has a reset-free Gate return with equal normal cost',()=>{
 const r=solveLevel(octS04,options),safe=solveLevel(octS04,{...options,forbiddenConditions:[{kind:'event',event:{key:'event:object-reset'}},{kind:'event',event:{key:'event:death-reset'}}]});
 expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([22,5]);expect([safe.bestPlan?.moves,safe.bestPlan?.pushes]).toEqual([22,5]);
 let s=createGame(octS04.board);for(const d of r.bestPlan!.directions){const m=move(s,d);expect(m.didMove).toBe(true);s=m.state;}expect(s.status).toBe('won');
});
it('requires horizontal return direction until the single Spike is removed',()=>{
 const forbiddenConditions=octS04.theorem.proofConditions;expect(solveLevel(octS04,{...options,forbiddenConditions}).status).toBe('proven-unsolved');
 const r=solveLevel({...octS04,board:{...octS04.board,terrainSpikes:[]}},{...options,forbiddenConditions});expect(r.status).toBe('solved');expect([r.bestPlan?.moves,r.bestPlan?.pushes]).toEqual([11,2]);
});
it('loses both Block and Gate preparation when attempting the lower hazardous approach',()=>{
 let s=createGame(octS04.board),death;const dirs=['up','right','down','left'] as const;
 for(const l of 'DLDDDLLUULUDD'){const m=move(s,dirs['URDL'.indexOf(l)]!);expect(m.didMove).toBe(true);s=m.state;death=m.events.find(e=>e.type==='death-reset')??death;}
 expect(death).toBeDefined();expect(s.blocks[0]!.position).toEqual({x:1,y:3});expect(s.gates[1]!.position).toEqual({x:0,y:1});
});
