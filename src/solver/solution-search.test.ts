import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog, masteryV2Catalog } from '../course/course-catalog';
import { createGame, move } from '../engine/game-engine';
import { buildSolutionReplay } from '../rendering/solution-replay';
import { findDemoSolution } from './solution-search';

const uniqueLevels = [...new Map([
  ...acceptedFoundationCatalog.levels, ...acceptedFoundationCatalog.labLevels,
  ...masteryV2Catalog.levels, ...masteryV2Catalog.labLevels,
].map((spec) => [spec.id, spec])).values()];

describe('general-purpose demo solutions', () => {
  it.each(uniqueLevels.map((spec) => [spec.id, spec] as const))('solves and replays %s through real rules', (_id, spec) => {
    const result = findDemoSolution(spec);
    expect(result.status).toBe('solved');
    if (result.status !== 'solved') throw new Error(`${spec.id}: ${result.status}`);
    const frames = buildSolutionReplay(spec.board, result.directions);
    expect(frames.at(-1)!.state.status).toBe('won');
    let state = createGame(spec.board);
    for (const [index, direction] of result.directions.entries()) {
      const turn = move(state, direction);
      expect(frames[index + 1]!.state).toEqual({ ...turn.state, history: [] });
      expect(frames[index + 1]!.events).toEqual(turn.events);
      expect(frames[index + 1]!.gateTraversal).toEqual(turn.gateTraversal);
      state = turn.state;
    }
  }, 20_000);
});
