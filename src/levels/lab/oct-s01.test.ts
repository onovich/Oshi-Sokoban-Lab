import { describe, expect, it } from 'vitest';
import { octS01 } from './oct-s01';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
import type { Direction } from '../../engine/types';
const options = { maximumStates: 30000, maximumPlans: 1, pushSlack: 0, moveSlack: 0 };
describe('octS01 footprint hazard bridge', () => {
  it('starts unfinished and replays a reset-free solution with equal cost', () => {
    let state = createGame(octS01.board);
    expect(isBlockSolved(state, state.blocks[0]!)).toBe(false);
    const normal = solveLevel(octS01, options);
    const safe = solveLevel(octS01, { ...options, forbiddenConditions: [
      { kind: 'event', event: { key: 'event:object-reset' } },
      { kind: 'event', event: { key: 'event:death-reset' } },
    ] });
    expect(normal.status).toBe('solved'); expect(safe.status).toBe('solved');
    expect([normal.bestPlan?.moves, normal.bestPlan?.pushes]).toEqual([safe.bestPlan?.moves, safe.bestPlan?.pushes]);
    for (const direction of safe.bestPlan!.directions) {
      const result = move(state, direction); expect(result.didMove).toBe(true); state = result.state;
    }
    expect(state.status).toBe('won');
  });
  it('requires nonfinal clearance, removed by deleting only the spike', () => {
    const forbiddenConditions = octS01.theorem.proofConditions;
    expect(solveLevel(octS01, { ...options, forbiddenConditions }).status).toBe('proven-unsolved');
    const contrast = solveLevel({ ...octS01, board: { ...octS01.board, terrainSpikes: [] } }, { ...options, forbiddenConditions });
    expect(contrast.status).toBe('solved');
    expect(contrast.bestPlan!.moves).toBeLessThan(solveLevel(octS01, options).bestPlan!.moves);
  });
  it('really loses displacement when the remote arm touches spike', () => {
    let state = createGame(octS01.board);
    const route: Direction[] = ['down','right','down','up','left','left','down','down','right','down','down','right','right','up','left','left','up'];
    let reset;
    for (const direction of route) {
      const result = move(state, direction); expect(result.didMove).toBe(true); state = result.state;
      reset = result.events.find(event => event.type === 'object-reset') ?? reset;
    }
    expect(reset).toMatchObject({ type: 'object-reset', from: {x:1,y:2}, to: {x:3,y:2}, contactCells: [{x:2,y:2}] });
    expect(state.blocks[0]!.position).toEqual({x:3,y:2});
    expect(state.player).toEqual({x:2,y:3});
  });
});
