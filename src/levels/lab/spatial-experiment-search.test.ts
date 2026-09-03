import { describe, expect, it } from 'vitest';

import { createGame, move } from '../../engine/game-engine';
import { proofConditionFromLegacy } from '../../course/proof-condition';
import { e01Prototype } from './e01-experiment';
import { searchSpatialExperiment } from './spatial-experiment-search';

describe('plain spatial experiment search boundary', () => {
  it('keeps different event histories when the same box position needs a different approach', () => {
    const board = {
      ...e01Prototype.board,
      width: 4, height: 4, player: { x: 0, y: 1 },
      walls: [{ x: 3, y: 0 }, { x: 3, y: 2 }, { x: 3, y: 3 }],
      terrainGoals: [{ x: 3, y: 1 }],
      blocks: [{ id: 'box', position: { x: 1, y: 1 }, shape: [{ x: 0, y: 0 }], number: 0, isFake: false }],
    };
    const forbidden = proofConditionFromLegacy(
      'event-sequence:event:block-pushed:box:from:1,1:to:2,1>event:block-pushed:box:from:2,1:to:3,1',
    );
    const ordinary = searchSpatialExperiment(createGame(board));
    expect(ordinary.solution).toEqual(['right', 'right']);
    const restricted = searchSpatialExperiment(createGame(board), { forbiddenConditions: [forbidden] });
    expect(restricted.status).toBe('solved');
    expect(restricted.solution!.length).toBeGreaterThan(2);
    let state = createGame(board);
    let enteredFromLeft = false;
    for (const direction of restricted.solution!) {
      const result = move(state, direction);
      for (const event of result.events) {
        if (event.type !== 'block-pushed') continue;
        if (event.from.x === 2 && event.from.y === 1 && event.to.x === 3 && event.to.y === 1) {
          expect(enteredFromLeft).toBe(false);
        }
        if (event.from.x === 1 && event.from.y === 1 && event.to.x === 2 && event.to.y === 1) {
          enteredFromLeft = true;
        }
      }
      state = result.state;
    }
    expect(state.status).toBe('won');
  });

  it('refuses rules whose state is not represented by the spatial transposition key', () => {
    const rain = createGame({ ...e01Prototype.board, weather: 'rain' });
    expect(() => searchSpatialExperiment(rain)).toThrow(/plain spatial/i);
  });

  it('keeps an exhausted budget unknown, then produces a replayable witness with enough budget', () => {
    const initial = createGame(e01Prototype.board);
    const exhausted = searchSpatialExperiment(initial, { maximumStates: 1 });
    expect(exhausted.status).toBe('budget-exhausted');
    expect(exhausted.solution).toBeUndefined();

    const solved = searchSpatialExperiment(initial);
    expect(solved.status).toBe('solved');
    let state = initial;
    for (const direction of solved.solution!) state = move(state, direction).state;
    expect(state.status).toBe('won');
    expect(initial.moves).toBe(0);
    expect(initial.history).toEqual([]);
  });
});
