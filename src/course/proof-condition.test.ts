import { describe, expect, it } from 'vitest';

import { acceptedFoundationCatalog } from './course-catalog';
import { proofConditionFromLegacy } from './proof-condition';

describe('typed level proof conditions', () => {
  it('parses one event, a minimum count, and an ordered sequence into explicit variants', () => {
    expect(proofConditionFromLegacy('event:block-pushed:box')).toEqual({
      kind: 'event',
      event: { key: 'event:block-pushed:box' },
    });
    expect(proofConditionFromLegacy('event-count:2:event:goal-pushed:goal')).toEqual({
      kind: 'count',
      event: { key: 'event:goal-pushed:goal' },
      atLeast: 2,
    });
    expect(proofConditionFromLegacy(
      'event-sequence:event:block-pushed:a>event:goal-crossed:b',
    )).toEqual({
      kind: 'sequence',
      events: [
        { key: 'event:block-pushed:a' },
        { key: 'event:goal-crossed:b' },
      ],
    });
  });

  it('gives every formal level typed proof, teaching, cognition, technique and difficulty metadata', () => {
    for (const level of acceptedFoundationCatalog.levels) {
      expect(level.theorem.proofConditions.length, level.id).toBeGreaterThan(0);
      expect(level.theorem.milestones.length, level.id).toBeGreaterThan(0);
      expect(level.techniques.some((technique) => technique.role === 'primary'), level.id).toBe(true);
      expect(level.cognitiveStage).toBeTruthy();
      expect(level.difficulty.target).toBeGreaterThanOrEqual(1);
      expect(level.difficulty.target).toBeLessThanOrEqual(3);
      expect(level.difficulty.confidence).toBe('author-accepted-foundation');
    }
  });
});
