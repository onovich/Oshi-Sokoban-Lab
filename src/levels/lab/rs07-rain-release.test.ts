import {expect,it} from 'vitest';
import {createGame,isBlockSolved,move} from '../../engine/game-engine';
import {solveLevel} from '../../solver/level-solver';
import {rainRelease} from './rs07-rain-release';

it('requires creating the apparently blocked arrangement before releasing the small block',()=>{
  const options={maximumStates:80000,maximumPlans:1};
  const report=solveLevel(rainRelease,options);
  expect(report.status).toBe('solved');
  let state=createGame(rainRelease.board);
  expect(state.blocks.every(b=>!isBlockSolved(state,b))).toBe(true);
  for(const direction of report.bestPlan!.directions)state=move(state,direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(rainRelease,{...options,forbiddenConditions:rainRelease.theorem.proofConditions}).status).toBe('proven-unsolved');
});

it('the blocked arrangement itself supplies the release-side stopping position',()=>{
  let state=createGame(rainRelease.board);
  for(const direction of ['right','right'] as const)state=move(state,direction).state;
  expect(move(state,'down').state.blocks[0]!.position).toEqual({x:3,y:1});
  for(const direction of ['down','right'] as const)state=move(state,direction).state;
  expect(state.player).toEqual({x:4,y:3});
  const stopped=move(state,'up').state;
  expect(stopped.player).toEqual({x:4,y:2});
  expect(move(stopped,'left').state.blocks[1]!.position).toEqual({x:2,y:2});
  // Local causal intervention only, not a playable replacement level.
  const withoutHorizontal={...state,blocks:state.blocks.slice(1)};
  expect(move(withoutHorizontal,'up').state.player).toEqual({x:4,y:0});
});
