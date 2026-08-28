import { describe, expect, it } from 'vitest';

import { createGame } from '../engine/game-engine';
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
});
