import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { rainHandoff } from './rs06-rain-handoff';
import { solveLevel } from '../../solver/level-solver';

it('can still finish after the horizontal block is completed in the observed revisit state', () => {
  // Observed route entry 234: horizontal at bottom, small block still at (2,2).
  const board = {
    ...rainHandoff.board,
    player: { x: 3, y: 3 },
    blocks: rainHandoff.board.blocks.map((block, index) => ({
      ...block, position: index === 0 ? { x: 3, y: 4 } : { x: 2, y: 2 },
    })),
  };
  let state = createGame(board);
  for (const direction of ['up', 'left', 'down', 'left', 'down', 'right', 'right', 'right'] as const) {
    state = move(state, direction).state;
  }
  expect(state.status).toBe('won');
  expect(solveLevel({ ...rainHandoff, board }, { maximumStates: 80000, maximumPlans: 1 }).status).toBe('solved');
});
