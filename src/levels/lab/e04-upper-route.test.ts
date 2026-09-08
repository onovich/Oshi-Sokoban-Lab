import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e04UpperRoute } from './e04-upper-route';
import { auditLevelMutations } from '../level-mutation-audit';
import { e04MiddleCourt } from './e04-teaching';

it('confirms the author screenshot is deadlocked without altering the middle-court board', () => {
  const initial=createGame(e04MiddleCourt.board);
  const snapshot={...initial,player:{x:2,y:1},blocks:initial.blocks.map(b=>({
    ...b,position:b.id.endsWith('-a') ? {x:3,y:1} : b.id.endsWith('-b') ? {x:1,y:0} : b.position,
  }))};
  expect(isBlockSolved(snapshot,snapshot.blocks[1]!)).toBe(true);
  expect(searchSpatialExperiment(snapshot).status).toBe('proven-unsolved');
});

it('an independent right route allows the same premature finish without moving B again', () => {
  const initial=createGame({...e04UpperRoute.board,walls:e04UpperRoute.board.walls.filter(p=>p.x!==4)});
  let state=move(move(initial,'up').state,'up').state;
  expect(isBlockSolved(state,state.blocks[1]!)).toBe(true);
  const report=searchSpatialExperiment(state,{forbiddenTransition:(_before,r)=>r.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-b'))});
  expect(report.status).toBe('solved');
  for(const d of report.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
});

it('has no unexplained redundant space or inconclusive mutations', () => {
  const report=auditLevelMutations(e04UpperRoute,200000);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
});

it('isolates the remaining upper access before the horizontal block can finish', () => {
  const initial=createGame(e04UpperRoute.board);
  expect(initial.blocks).toHaveLength(2);
  const report=searchSpatialExperiment(initial);
  expect(report.status).toBe('solved');
  let state=initial;
  for(const direction of report.solution!) state=move(state,direction).state;
  expect(state.status).toBe('won');
  expect(searchSpatialExperiment(initial,{forbiddenConditions:e04UpperRoute.theorem.proofConditions}).status).toBe('proven-unsolved');
  state=move(move(initial,'up').state,'up').state;
  expect(isBlockSolved(state,state.blocks[1]!)).toBe(true);
  expect(searchSpatialExperiment(state).status).toBe('proven-unsolved');
});
