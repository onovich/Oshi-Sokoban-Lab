import { describe, expect, it } from 'vitest';

import { createGame, move } from '../engine/game-engine';
import type { DomainEvent, LevelSpec } from '../engine/types';
import { courseGroups, courseLevels } from './course-catalog';
import { analyzeLevel } from './level-analyzer';

function lesson(id: string): LevelSpec {
  const result = courseLevels.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Missing course lesson ${id}.`);
  return result;
}

function replayEvents(spec: LevelSpec): readonly DomainEvent[] {
  const solution = analyzeLevel(spec).solution;
  if (!solution) throw new Error(`${spec.id} has no solution.`);
  let state = createGame(spec.board);
  const events: DomainEvent[] = [];
  for (const direction of solution) {
    const result = move(state, direction);
    events.push(...result.events);
    state = result.state;
  }
  expect(state.status).toBe('won');
  return events;
}

describe('evidence-led curriculum behavior', () => {
  it('keeps each technique group ordered as establish, boundary, inference', () => {
    for (const group of courseGroups) {
      expect(courseLevels.filter((level) => level.groupId === group.id).map((level) => level.role))
        .toEqual(['establish', 'boundary', 'inference']);
    }
  });

  it('uses object reset rather than destruction in the Spike origin lesson', () => {
    expect(replayEvents(lesson('lesson-19')).some((event) =>
      event.type === 'object-reset' && event.entityType === 'block',
    )).toBe(true);
  });

  it('forces the three respawn-framing lessons through their intended compact routes', () => {
    expect(analyzeLevel(lesson('lesson-19')).solution).toEqual(['right', 'right', 'up']);
    expect(analyzeLevel(lesson('lesson-20')).solution).toEqual(['right', 'right', 'up']);
    expect(analyzeLevel(lesson('lesson-21')).solution).toEqual(['up', 'down', 'right', 'right', 'up']);

    const significant = (id: string) => replayEvents(lesson(id)).filter(
      (event) => event.type === 'block-pushed' || event.type === 'object-reset',
    ).map((event) => `${event.type}:${event.entityId}`);

    expect(significant('lesson-19')).toEqual([
      'block-pushed:lesson-19-fake',
      'block-pushed:lesson-19-fake',
      'object-reset:lesson-19-fake',
      'block-pushed:lesson-19-block',
    ]);
    expect(significant('lesson-20')).toEqual([
      'block-pushed:lesson-20-block-a',
      'block-pushed:lesson-20-block-a',
      'object-reset:lesson-20-block-a',
      'block-pushed:lesson-20-block-b',
    ]);
    expect(significant('lesson-21')).toEqual([
      'block-pushed:lesson-21-block-a',
      'block-pushed:lesson-21-fake',
      'block-pushed:lesson-21-fake',
      'object-reset:lesson-21-fake',
      'block-pushed:lesson-21-block-b',
    ]);
  });

  it('rejects a Spike reset when the player would occupy the Block origin', () => {
    const spec = lesson('lesson-23');
    const result = move(createGame(spec.board), 'up');

    expect(result.didMove).toBe(false);
    expect(result.events).toEqual([]);
    expect(result.event).toContain('Reset conflict');
  });

  it('crosses a blocked movable Goal through its explicit mode event', () => {
    expect(replayEvents(lesson('lesson-31')).some((event) => event.type === 'goal-crossed')).toBe(true);
  });

  it('turns a blocked remote Gate exit into a Gate push', () => {
    expect(replayEvents(lesson('lesson-44')).some((event) => event.type === 'gate-pushed')).toBe(true);
  });

  it('clears a remote Gate obstruction before returning through the pair', () => {
    const events = replayEvents(lesson('lesson-45'));
    const types = events.map((event) => event.type);

    expect(types).toEqual([
      'gate-pushed',
      'gate-traversed',
      'block-pushed',
      'block-pushed',
      'gate-traversed',
      'block-pushed',
    ]);
  });

  it('uses both directions of a Gate pair after moving one endpoint', () => {
    const traversals = replayEvents(lesson('lesson-48')).filter(
      (event): event is Extract<DomainEvent, { type: 'gate-traversed' }> => event.type === 'gate-traversed',
    );

    expect(traversals.map((event) => event.entryGateId)).toEqual([
      'lesson-48-gate-a',
      'lesson-48-gate-b',
    ]);
  });

  it('carries a Rain trajectory through a Gate', () => {
    const events = replayEvents(lesson('lesson-55'));
    expect(events.some((event) => event.type === 'rain-slid')).toBe(true);
    expect(events.some((event) => event.type === 'gate-traversed')).toBe(true);
  });

  it('resets and uses the first Gate before resetting the paired endpoint', () => {
    const significant = replayEvents(lesson('lesson-63')).filter((event) =>
      event.type === 'object-reset' || event.type === 'gate-traversed',
    );

    expect(significant.map((event) =>
      event.type === 'object-reset' ? `reset:${event.entityId}` : `enter:${event.entryGateId}`,
    )).toEqual([
      'reset:lesson-63-gate-a',
      'enter:lesson-63-gate-a',
      'reset:lesson-63-gate-b',
    ]);
  });
});
