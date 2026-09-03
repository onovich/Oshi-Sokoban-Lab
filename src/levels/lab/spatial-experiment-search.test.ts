import { describe, expect, it } from 'vitest';

import { createGame, move } from '../../engine/game-engine';
import { e01Prototype } from './e01-experiment';
import { searchSpatialExperiment } from './spatial-experiment-search';

describe('plain spatial experiment search boundary', () => {
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
