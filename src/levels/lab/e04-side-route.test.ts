import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e04SideRoute } from './e04-side-route';
import { auditLevelMutations } from '../level-mutation-audit';
import { e04UpperRoute } from './e04-upper-route';

it('contains no unexplained spare space', () => {
  const report=auditLevelMutations(e04SideRoute,200000);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
});

it('makes the new access route necessary while permitting early horizontal completion', () => {
  const initial=createGame(e04SideRoute.board);
  const report=searchSpatialExperiment(initial);
  expect(report.status).toBe('solved');
  let state=initial;
  for(const d of report.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
  expect(searchSpatialExperiment(initial,{forbiddenConditions:e04SideRoute.theorem.proofConditions}).status).toBe('proven-unsolved');
  expect(searchSpatialExperiment(initial,{forbiddenTransition:(_b,r)=>r.state.player.x===4&&r.state.player.y===0}).status).toBe('proven-unsolved');
  state=move(move(initial,'up').state,'up').state;
  expect(isBlockSolved(state,state.blocks[1]!)).toBe(true);
  const after=searchSpatialExperiment(state,{forbiddenTransition:(_b,r)=>r.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-b'))});
  expect(after.status).toBe('solved');
  for(const d of after.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
  const parent=createGame(e04UpperRoute.board);
  const parentAfter=move(move(parent,'up').state,'up').state;
  expect(isBlockSolved(parentAfter,parentAfter.blocks[1]!)).toBe(true);
  expect(searchSpatialExperiment(parentAfter).status).toBe('proven-unsolved');
});
