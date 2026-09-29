import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { bd1DirectionChoice } from './bd1-direction-choice';

it('needs two entry directions to obtain the two different pushing sides', () => {
  const options = { maximumStates: 20000, maximumPlans: 1 };
  const report = solveLevel(bd1DirectionChoice, options);
  expect(report.status).toBe('solved');
  let state = createGame(bd1DirectionChoice.board);
  for (const direction of report.bestPlan!.directions) {
    const turn = move(state, direction);
    expect(turn.didMove).toBe(true);
    state = turn.state;
  }
  expect(state.status).toBe('won');
  for (const condition of bd1DirectionChoice.theorem.proofConditions) {
    expect(solveLevel(bd1DirectionChoice, { ...options, forbiddenConditions: [condition] }).status)
      .toBe('proven-unsolved');
  }
});

it('allows the nearest-entry trial to return safely but not its tempting box push', () => {
  const initial = createGame(bd1DirectionChoice.board);
  const left = move(initial, 'left').state;
  const returned = move(left, 'right').state;
  expect(returned.player).toEqual(initial.player);
  expect(returned.blocks).toEqual(initial.blocks);
  expect(returned.gates).toEqual(initial.gates);
  const wrong = move(move(left, 'down').state, 'right').state;
  expect(solveLevel({ ...bd1DirectionChoice, board: { ...bd1DirectionChoice.board,
    player: wrong.player, blocks: wrong.blocks, gates: wrong.gates,
  } }, { maximumStates: 20000, maximumPlans: 1 }).status).toBe('proven-unsolved');
});

it('removes the entry-right requirement when an independent side route is opened', () => {
  const contrast = { ...bd1DirectionChoice, board: { ...bd1DirectionChoice.board,
    walls: bd1DirectionChoice.board.walls.filter(c => c.x !== 5 || c.y !== 3),
  } };
  expect(solveLevel(contrast, { maximumStates: 20000, maximumPlans: 1,
    forbiddenConditions: [{ kind: 'event', event: { key: 'event:gate-traversed:right' } }],
  }).status).toBe('solved');
});
