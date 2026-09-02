import { describe, expect, it } from 'vitest';

import { createGame, move } from '../engine/game-engine';
import { courseLevels } from './course-catalog';
import { analyzeLevel } from './level-analyzer';

describe('bounded course solvability', () => {
  for (const level of courseLevels) {
    it(`${level.id} has a replayable optimal route`, () => {
      const result = analyzeLevel(level, 100_000);
      expect(result.solution, `explored ${result.exploredStates} states`).toBeDefined();

      let state = createGame(level.board);
      for (const direction of result.solution ?? []) {
        const transition = move(state, direction);
        expect(transition.didMove, `${direction} must remain effective`).toBe(true);
        state = transition.state;
      }
      expect(state.status).toBe('won');
    });
  }
});
