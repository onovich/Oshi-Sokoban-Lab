import { describe, expect, it } from 'vitest';

import { createGame, isBlockSolved } from '../engine/game-engine';
import { courseLevels } from './course-catalog';
import { demoLevels } from './demo-levels';

describe('demo level catalogue', () => {
  it('publishes all sixty-three course boards with objectives and no hints', () => {
    expect(demoLevels).toHaveLength(63);
    expect(demoLevels.map((level) => level.id)).toEqual(courseLevels.map((level) => level.id));

    for (const level of demoLevels) {
      expect(() => createGame(level)).not.toThrow();
      expect(level.objective).toBeTruthy();
      expect(level.hint).toBeUndefined();
    }
  });

  it('starts every lesson as an unfinished puzzle with a real victory condition', () => {
    for (const level of demoLevels) {
      const state = createGame(level);
      const realBlocks = state.blocks.filter((block) => !block.isFake);

      expect(realBlocks, `${level.id} needs at least one real Block`).not.toHaveLength(0);
      expect(realBlocks.some((block) => !isBlockSolved(state, block)), `${level.id} starts complete`).toBe(true);
    }
  });

  it('uses stable sequential board identifiers', () => {
    expect(demoLevels.map((level) => level.id)).toEqual(
      Array.from({ length: 63 }, (_, index) => `lesson-${String(index + 1).padStart(2, '0')}`),
    );
  });
});
