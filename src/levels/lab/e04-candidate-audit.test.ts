import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move } from '../../engine/game-engine';
import { e06Prototype } from './e06-experiment';
import { searchSpatialExperiment } from './spatial-experiment-search';

/** Rejected authoring probes, deliberately absent from every playable catalog.
 * These check one proposed E04 relation, not a universal difficulty formula.
 */
const probes = [
  { name: 'west-cover', goals: [[1,2],[1,3],[4,0],[5,1],[3,2]], closed: false, open: false },
  { name: 'south-cover', goals: [[2,3],[2,4],[4,0],[5,1],[3,2]], closed: true, open: true },
  { name: 'double-cover', goals: [[2,3],[2,4],[4,0],[5,1],[3,3],[3,4]], closed: true, open: true },
  { name: 'central-cover', goals: [[3,2],[3,3],[4,0],[5,1],[1,2]], closed: false, open: true },
  { name: 'east-near', goals: [[3,3],[3,4],[5,2],[4,0],[3,2]], closed: true, open: true },
  { name: 'west-near', goals: [[3,3],[3,4],[5,1],[1,2],[3,2]], closed: true, open: true },
  { name: 'two-near', goals: [[3,3],[3,4],[5,2],[1,2],[3,2]], closed: true, open: true },
] as const;

it.each(probes)('$name is either unsolved or bypasses the proposed withdrawal relationship', probe => {
  for (const independentRoute of [false, true]) {
    const board = {
      ...e06Prototype.board,
      walls: independentRoute
        ? e06Prototype.board.walls.filter(p => p.x !== 2 || p.y !== 1)
        : e06Prototype.board.walls,
      terrainGoals: probe.goals.map(([x, y]) => ({ x, y })),
    };
    const initial = createGame(board);
    const expectedSolvable = independentRoute ? probe.open : probe.closed;
    const normal = searchSpatialExperiment(initial, { maximumStates: 100000 });
    expect(normal.status).toBe(expectedSolvable ? 'solved' : 'proven-unsolved');
    if (!expectedSolvable) continue;
    const withoutWithdrawal = searchSpatialExperiment(initial, {
      maximumStates: 100000,
      forbiddenTransition: (before, result) =>
        isBlockSolved(before, before.blocks[0]!) &&
        !isBlockSolved(result.state, result.state.blocks[0]!),
    });
    expect(withoutWithdrawal.status).toBe('solved');
    // A valid witness exists without the proposed coordination event.
    // Unknown/budget-exhausted results never pass this rejection assertion.
    expect(withoutWithdrawal.solution).toBeDefined();
    let state = initial;
    for (const direction of withoutWithdrawal.solution!) {
      const result = move(state, direction);
      expect(result.didMove).toBe(true);
      expect(isBlockSolved(state, state.blocks[0]!) && !isBlockSolved(result.state, result.state.blocks[0]!)).toBe(false);
      state = result.state;
    }
    expect(state.status).toBe('won');
  }
}, 30000);
