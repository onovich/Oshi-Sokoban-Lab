import { describe, expect, it } from 'vitest';

import { createGame, isBlockSolved } from '../engine/game-engine';
import { demoLevels } from './demo-levels';

describe('demo level catalogue', () => {
  it('loads twelve compact, single-focus lessons that collectively expose every implemented Oshi mechanic', () => {
    expect(demoLevels).toHaveLength(12);
    expect(demoLevels.flatMap((level) => level.mechanics ?? [])).toEqual(
      expect.arrayContaining([
        '多格 footprint',
        '多格 Wall',
        'B2 / G2 编号',
        'Fake Block',
        'Spike',
        'Rain',
        '可推动 Goal',
        'Gate 传送',
        '可推动 Gate',
        'Loop Path',
        'Ping-pong Path',
        '步数限制',
      ]),
    );
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

  it('makes Ping-pong Spike danger and its death-reset behavior explicit before play', () => {
    const level = demoLevels.find((candidate) => candidate.id === 'path-pingpong-11');

    expect(level?.description).toContain('不会被角色阻挡');
    expect(level?.description).toContain('重置');
    expect(level?.objective).toContain('绕开');
  });
});
