import { describe, expect, it } from 'vitest';

import { createGame, isBlockSolved } from '../engine/game-engine';
import { demoLevels } from './demo-levels';

describe('demo level catalogue', () => {
  it('loads twelve compact lessons with a visible objective, hint, and playable initial state', () => {
    expect(demoLevels).toHaveLength(12);
    for (const level of demoLevels) {
      expect(() => createGame(level)).not.toThrow();
      expect(level.objective).toBeTruthy();
      expect(level.hint).toBeTruthy();
    }
  });

  it('starts every lesson as an unfinished puzzle with a real victory condition', () => {
    for (const level of demoLevels) {
      const state = createGame(level);
      const realBlocks = state.blocks.filter((block) => !block.isFake);

      expect(realBlocks, `${level.id} needs at least one real Block`).not.toHaveLength(0);
      expect(
        realBlocks.some((block) => !isBlockSolved(state, block)),
        `${level.id} must not already satisfy every real Block at entry`,
      ).toBe(true);
    }
  });

  it('orders the first curriculum batch as four single-mechanic technique groups of three stages', () => {
    expect(
      demoLevels.map((level) => ({
        id: level.id,
        familyId: level.curriculum?.familyId,
        techniqueId: level.curriculum?.techniqueId,
        phase: level.curriculum?.phase,
      })),
    ).toEqual([
      { id: 'occupancy-guide-01', familyId: 'occupancy', techniqueId: 'occupancy-clearance', phase: 'guide' },
      { id: 'occupancy-verify-02', familyId: 'occupancy', techniqueId: 'occupancy-clearance', phase: 'verify' },
      { id: 'occupancy-challenge-03', familyId: 'occupancy', techniqueId: 'occupancy-clearance', phase: 'challenge' },
      { id: 'spike-guide-04', familyId: 'spike-reset', techniqueId: 'spike-reset-positioning', phase: 'guide' },
      { id: 'spike-verify-05', familyId: 'spike-reset', techniqueId: 'spike-reset-positioning', phase: 'verify' },
      { id: 'spike-challenge-06', familyId: 'spike-reset', techniqueId: 'spike-reset-positioning', phase: 'challenge' },
      { id: 'movable-goal-guide-07', familyId: 'movable-goal', techniqueId: 'goal-mode-switch', phase: 'guide' },
      { id: 'movable-goal-verify-08', familyId: 'movable-goal', techniqueId: 'goal-mode-switch', phase: 'verify' },
      { id: 'movable-goal-challenge-09', familyId: 'movable-goal', techniqueId: 'goal-mode-switch', phase: 'challenge' },
      { id: 'gate-guide-10', familyId: 'gate', techniqueId: 'gate-remote-pushability', phase: 'guide' },
      { id: 'gate-verify-11', familyId: 'gate', techniqueId: 'gate-remote-pushability', phase: 'verify' },
      { id: 'gate-challenge-12', familyId: 'gate', techniqueId: 'gate-remote-pushability', phase: 'challenge' },
    ]);
  });
});
