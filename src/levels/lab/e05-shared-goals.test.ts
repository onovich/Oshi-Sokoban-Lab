import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e05SharedGoals } from './e05-shared-goals';
import { auditLevelMutations } from '../level-mutation-audit';
import type { GameState } from '../../engine/types';

function play(initial: GameState, route: string) {
  let state=initial;
  const directions={U:'up',R:'right',D:'down',L:'left'} as const;
  for(const letter of route) {
    const result=move(state,directions[letter as keyof typeof directions]);
    expect(result.didMove).toBe(true);
    state=result.state;
  }
  return state;
}

it('the author screenshot has lost the recoverable southern access', () => {
  const initial=createGame(e05SharedGoals.board);
  const state={...initial,player:{x:3,y:3},blocks:initial.blocks.map(b=>({...b,
    position:b.id.endsWith('-a') ? {x:4,y:2} : b.id.endsWith('-b') ? {x:1,y:3} : {x:3,y:4},
  }))};
  expect(isBlockSolved(state,state.blocks[0]!)).toBe(true);
  expect(searchSpatialExperiment(state,{maximumStates:200000}).status).toBe('proven-unsolved');
});

it('an executable one-push completion is a deadlock, not a forbidden input', () => {
  const initial=createGame(e05SharedGoals.board);
  const state=play(initial,'URRRDDLU');
  expect(isBlockSolved(state,state.blocks[1]!)).toBe(true);
  expect(state.blocks[0]!.position).toEqual(initial.blocks[0]!.position);
  expect(state.blocks[2]!.position).toEqual(initial.blocks[2]!.position);
  expect(searchSpatialExperiment(state,{maximumStates:200000}).status).toBe('proven-unsolved');
});

it('moving only the leftmost top goal to the right removes the need to reposition a completed horizontal block', () => {
  const board={...e05SharedGoals.board,terrainGoals:e05SharedGoals.board.terrainGoals.map(p=>p.x===0&&p.y===0 ? {x:3,y:0} : p)};
  let state=createGame(board);
  const report=searchSpatialExperiment(state,{maximumStates:200000,forbiddenTransition:(before,result)=>
    result.events.some(e=>e.type==='block-pushed' && e.entityId.endsWith('-b') &&
      isBlockSolved(before,before.blocks.find(b=>b.id===e.entityId)!)),
  });
  expect(report.status).toBe('solved');
  for(const d of report.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
});

it('permits finishing the vertical transport before the final goal reassignment', () => {
  let state=createGame(e05SharedGoals.board);
  const report=searchSpatialExperiment(state,{maximumStates:200000,forbiddenTransition:(before,result)=>
    (result.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-b')&&e.from.x===1&&e.from.y===0&&e.to.x===0&&e.to.y===0)&&
      (!isBlockSolved(before,before.blocks[0]!) || before.blocks[2]!.position.y<3)) || result.state.blocks[2]!.position.x<2,
  });
  expect(report.status).toBe('solved');
  let reassigned=false;
  let tailPushes=0;
  for(const d of report.solution!) {
    const result=move(state,d);
    if(reassigned) tailPushes+=result.events.filter(e=>e.type==='block-pushed').length;
    if(result.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-b')&&e.from.x===1&&e.from.y===0&&e.to.x===0&&e.to.y===0)) reassigned=true;
    state=result.state;
  }
  expect(state.status).toBe('won');
  expect(reassigned).toBe(true);
  expect(tailPushes).toBeLessThanOrEqual(6);
});

it('accounts for all entity, goal, and floor mutations', () => {
  const report=auditLevelMutations(e05SharedGoals,200000);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
},60000);

it('offers a replayable three-object coordination candidate', () => {
  const initial=createGame(e05SharedGoals.board);
  expect(initial.blocks).toHaveLength(3);
  const report=searchSpatialExperiment(initial,{maximumStates:200000});
  expect(report.status).toBe('solved');
  let state=initial;
  for(const direction of report.solution!) {
    const result=move(state,direction);
    expect(result.didMove).toBe(true);
    state=result.state;
  }
  expect(state.status).toBe('won');
});

it('requires repositioning a completed horizontal block rather than assigning the nearest matching targets once', () => {
  expect(e05SharedGoals.theorem.proofConditions).not.toHaveLength(0);
  const initial=createGame(e05SharedGoals.board);
  expect(searchSpatialExperiment(initial,{maximumStates:200000,forbiddenConditions:e05SharedGoals.theorem.proofConditions}).status).toBe('proven-unsolved');
  const withoutRearrangement=searchSpatialExperiment(initial,{maximumStates:200000,forbiddenTransition:(before,result)=>
    result.events.some(e=>e.type==='block-pushed' && e.entityId.endsWith('-b') &&
      isBlockSolved(before,before.blocks.find(b=>b.id===e.entityId)!)),
  });
  expect(withoutRearrangement.status).toBe('proven-unsolved');
});
