import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move, undo } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { ba2SharedBay } from './ba2-shared-bay';

it('needs an interleaved handoff, not independent completion of the two tasks', () => {
  const spec = ba2SharedBay;
  const options = { maximumStates: 80000, maximumPlans: 1 };
  let state = createGame(spec.board);
  expect(state.blocks.every(block => !isBlockSolved(state, block))).toBe(true);
  const report = solveLevel(spec, options);
  expect(report.status).toBe('solved');
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(spec, { ...options, forbiddenConditions: spec.theorem.proofConditions }).status).toBe('proven-unsolved');
  const contrast = { ...spec, board: { ...spec.board, walls: spec.board.walls.filter(p => p.x !== 3 || p.y !== 2) } };
  expect(solveLevel(contrast, { ...options, forbiddenConditions: [{ kind: 'event', event: {
    key: `event:block-pushed:${spec.id}-a:from:4,3:to:4,4`,
  } }] }).status).toBe('solved');
});

it('replays AI inputs but rejects the overgeneralization that entering the bottom row is fatal', () => {
  const directions = { U: 'up', D: 'down', L: 'left', R: 'right' } as const;
  const replay = (route: string) => {
    let state = createGame(ba2SharedBay.board);
    for (const input of route) {
      if (input === 'Z') { state = undo(state); continue; }
      const result = move(state, directions[input as keyof typeof directions]);
      expect(result.didMove).toBe(true);
      state = result.state;
    }
    return state;
  };
  const actual = replay('DDLLULDDZRDDRRUDLLUULDLDRRR');
  expect(actual.status).toBe('won');
  expect(actual.moves).toBe(25);
  // Continue the AI's pre-Undo state instead: B can be on the bottom row
  // before A is recovered. It must not occupy A's actual recovery stand.
  expect(replay('DDLLULDDRDRRUDLLULLDRRR').status).toBe('won');
});
