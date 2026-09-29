import { expect, it } from 'vitest';
import { createGame, isBlockSolved, move, undo } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { ba1ReturnPassage } from './ba1-return-passage';

it('requires both making room and reclaiming the passage in a complete unfinished puzzle', () => {
  const spec = ba1ReturnPassage;
  let state = createGame(spec.board);
  expect(state.blocks.every(block => !isBlockSolved(state, block))).toBe(true);
  const options = { maximumStates: 80000, maximumPlans: 1 };
  const report = solveLevel(spec, options);
  expect(report.status).toBe('solved');
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  for (const condition of spec.theorem.proofConditions) {
    expect(solveLevel(spec, { ...options, forbiddenConditions: [condition] }).status).toBe('proven-unsolved');
  }
});

it('replays the independent AI player record including its mistake and two undos', () => {
  let state = createGame(ba1ReturnPassage.board);
  const directions = { U: 'up', D: 'down', L: 'left', R: 'right' } as const;
  let blocked = 0;
  for (const input of 'RUUZZLURDRURRRUULDRDLLLLRRRUUULLDDD') {
    if (input === 'Z') { state = undo(state); continue; }
    const result = move(state, directions[input as keyof typeof directions]);
    if (!result.didMove) blocked++;
    state = result.state;
  }
  expect(state.status).toBe('won');
  expect(state.moves).toBe(30);
  expect(blocked).toBe(1);
});
