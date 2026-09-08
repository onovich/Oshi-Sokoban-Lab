import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e05ReturnRoute } from './e05-return-route';
import { auditLevelMutations } from '../level-mutation-audit';

it('the upper cell preserves a legal recoverable parking choice even though it does not shorten the solution', () => {
  for(const sealed of [false,true]) {
    const board={...e05ReturnRoute.board,walls:[...e05ReturnRoute.board.walls,...(sealed ? [{x:3,y:0}] : [])]};
    let state=createGame(board);
    for(const d of ['left','down','down','right','up'] as const) {
      const result=move(state,d);
      expect(result.didMove).toBe(true);
      state=result.state;
    }
    expect(state.blocks[1]!.position).toEqual({x:3,y:1});
    expect(searchSpatialExperiment(state).status).toBe(sealed ? 'proven-unsolved' : 'solved');
  }
});

it('moving only the closing goal removes the obligation to retrieve before completion', () => {
  const searchWithEarlyCompletion=(board:typeof e05ReturnRoute.board) => {
    let state=createGame(board);
    const report=searchSpatialExperiment(state,{forbiddenTransition:(before,result)=>
      result.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-b')&&e.from.y===4&&e.to.y===3)&&
      !isBlockSolved(before,before.blocks[1]!),
    });
    if(report.solution) for(const direction of report.solution) state=move(state,direction).state;
    return {report,state};
  };
  expect(searchWithEarlyCompletion(e05ReturnRoute.board).report.status).toBe('proven-unsolved');
  const contrast={...e05ReturnRoute.board,terrainGoals:e05ReturnRoute.board.terrainGoals.map(p=>p.x===3&&p.y===4 ? {x:3,y:0} : p)};
  const result=searchWithEarlyCompletion(contrast);
  expect(result.report.status).toBe('solved');
  expect(result.state.status).toBe('won');
});

it('has no unexplained redundant or unknown mutations', () => {
  const report=auditLevelMutations(e05ReturnRoute,200000);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
},60000);

it('isolates retrieval before closing a southern passage in a two-object puzzle', () => {
  let state=createGame(e05ReturnRoute.board);
  expect(state.blocks).toHaveLength(2);
  const report=searchSpatialExperiment(state);
  expect(report.status).toBe('solved');
  for(const d of report.solution!) state=move(state,d).state;
  expect(state.status).toBe('won');
  expect(searchSpatialExperiment(createGame(e05ReturnRoute.board),{forbiddenConditions:e05ReturnRoute.theorem.proofConditions}).status).toBe('proven-unsolved');
  state=createGame(e05ReturnRoute.board);
  state=move(move(state,'down').state,'down').state;
  expect(isBlockSolved(state,state.blocks[1]!)).toBe(true);
  expect(searchSpatialExperiment(state).status).toBe('proven-unsolved');
});
