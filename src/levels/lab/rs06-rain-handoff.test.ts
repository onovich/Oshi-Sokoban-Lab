import {expect,it} from 'vitest';
import {createGame,isBlockSolved,move} from '../../engine/game-engine';
import {solveLevel} from '../../solver/level-solver';
import {rainHandoff} from './rs06-rain-handoff';

it('starts with empty goals and requires both stages of the small block handoff',()=>{
  const initial=createGame(rainHandoff.board);
  expect(initial.blocks.every(b=>!isBlockSolved(initial,b))).toBe(true);
  const options={maximumStates:80000,maximumPlans:1};
  const report=solveLevel(rainHandoff,options);
  expect(report.status).toBe('solved');
  let state=initial;
  for(const d of report.bestPlan!.directions)state=move(state,d).state;
  expect(state.status).toBe('won');
  for(const condition of rainHandoff.theorem.proofConditions){
    expect(solveLevel(rainHandoff,{...options,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
  }
});

it('requires transporting the horizontal block while the small block is still off its final goal',()=>{
  const queue=[createGame(rainHandoff.board)];
  const key=(s:typeof queue[number])=>JSON.stringify([s.player,s.blocks.map(b=>b.position)]);
  const seen=new Set([key(queue[0]!)]);
  for(let i=0;i<queue.length;i++){
    const state=queue[i]!;
    expect(state.status).not.toBe('won');
    for(const d of ['up','right','down','left'] as const){
      const next=move(state,d).state;
      // Counterfactual: require the small block to be home before horizontal transit.
      const small=state.blocks[1]!.position;
      const before=state.blocks[0]!.position, after=next.blocks[0]!.position;
      if(before.x===2&&before.y===2&&after.x===3&&after.y===2&&!(small.x===4&&small.y===2))continue;
      const k=key(next);if(seen.has(k))continue;
      seen.add(k);queue.push({...next,history:[]});
    }
  }
});
