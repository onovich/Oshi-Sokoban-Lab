import { describe, expect, it } from 'vitest';
import { octS02 } from './oct-s02';
import { solveLevel } from '../../solver/level-solver';
import { createGame, move, isBlockSolved } from '../../engine/game-engine';
import type { Direction } from '../../engine/types';
const options = { maximumStates: 80000, maximumPlans: 1, pushSlack: 0, moveSlack: 0 };
describe('octS02 Goal hazard bridge', () => {
  it('has equal shortest-input normal and reset-free costs and actual winning replay', () => {
    const normal = solveLevel(octS02, options);
    const safe = solveLevel(octS02, { ...options, forbiddenConditions: [
      { kind: 'event', event: { key: 'event:object-reset' } },
      { kind: 'event', event: { key: 'event:death-reset' } },
    ] });
    expect(normal.status).toBe('solved'); expect(safe.status).toBe('solved');
    expect([normal.bestPlan?.moves, normal.bestPlan?.pushes]).toEqual([19,9]);
    expect([safe.bestPlan?.moves, safe.bestPlan?.pushes]).toEqual([19,9]);
    let state = createGame(octS02.board); expect(isBlockSolved(state,state.blocks[0]!)).toBe(false);
    for (const direction of safe.bestPlan!.directions) { const r=move(state,direction);expect(r.didMove).toBe(true);state=r.state; }
    expect(state.status).toBe('won');
  });
  it('requires temporary side staging, lifted by deleting only the spike', () => {
    const forbiddenConditions=octS02.theorem.proofConditions;
    expect(solveLevel(octS02,{...options,forbiddenConditions}).status).toBe('proven-unsolved');
    const free=solveLevel({...octS02,board:{...octS02.board,terrainSpikes:[]}},{...options,forbiddenConditions});
    expect(free.status).toBe('solved');expect(free.bestPlan?.moves).toBe(14);expect(free.bestPlan?.pushes).toBe(3);
  });
  it('resets the moved Goal and leaves the player at the trigger side', () => {
    let state=createGame(octS02.board),reset;
    const route: Direction[]=['left','down','down','down','right','down','left','left','left','up','up','up'];
    for(const direction of route){const r=move(state,direction);expect(r.didMove).toBe(true);state=r.state;reset=r.events.find(e=>e.type==='object-reset')??reset;}
    expect(reset).toMatchObject({entityType:'goal',from:{x:1,y:0},to:{x:1,y:2}});
    expect(state.player).toEqual({x:1,y:1});expect(state.goals[0]!.position).toEqual({x:1,y:2});
  });
});
