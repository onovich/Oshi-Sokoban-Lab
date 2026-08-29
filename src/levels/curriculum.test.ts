import { describe, expect, it } from 'vitest';

import { createGame, move } from '../engine/game-engine';
import type { Direction, LevelDefinition } from '../engine/types';
import { demoLevels } from './demo-levels';

type PlannedLesson = Readonly<{
  id: string;
  phase: 'guide' | 'verify' | 'challenge';
  walkthrough: readonly Direction[];
}>;

function lessonById(id: string): LevelDefinition | undefined {
  return demoLevels.find((lesson) => lesson.id === id);
}

function expectWalkthroughToWin(level: LevelDefinition, walkthrough: readonly Direction[]): void {
  let state = createGame(level);

  for (const direction of walkthrough) {
    const result = move(state, direction);
    expect(result.didMove, `${level.id}: ${direction} should be an effective action`).toBe(true);
    state = result.state;
  }

  expect(state.status, `${level.id} walkthrough should end in victory`).toBe('won');
}

describe('single-mechanic curriculum: whole-occupancy checks', () => {
  const lessons: readonly PlannedLesson[] = [
    { id: 'occupancy-guide-01', phase: 'guide', walkthrough: ['right', 'right'] },
    { id: 'occupancy-verify-02', phase: 'verify', walkthrough: ['down', 'down', 'right', 'up', 'left', 'up', 'up', 'right'] },
    { id: 'occupancy-challenge-03', phase: 'challenge', walkthrough: ['right', 'up', 'right', 'down', 'left', 'down', 'right'] },
  ];

  it('ships an ordered guide, verification, and challenge trio under one named technique', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);

      expect(lesson, `${planned.id} should exist`).toBeDefined();
      expect(lesson?.curriculum).toMatchObject({
        familyId: 'occupancy',
        techniqueId: 'occupancy-clearance',
        phase: planned.phase,
      });
      expect(lesson?.mechanics).toContain('整块占格');
    }
  });

  it('keeps every whole-occupancy lesson playable through its intended route', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);
      expect(lesson, `${planned.id} should exist`).toBeDefined();
      if (lesson) expectWalkthroughToWin(lesson, planned.walkthrough);
    }
  });
});

describe('single-mechanic curriculum: Spike reset positioning', () => {
  const lessons: readonly PlannedLesson[] = [
    { id: 'spike-guide-04', phase: 'guide', walkthrough: ['right', 'right', 'left', 'left'] },
    { id: 'spike-verify-05', phase: 'verify', walkthrough: ['left', 'left', 'right', 'right'] },
    { id: 'spike-challenge-06', phase: 'challenge', walkthrough: ['right', 'right', 'right', 'left', 'left', 'left'] },
  ];

  it('ships an ordered guide, verification, and challenge trio under one reset technique', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);

      expect(lesson, `${planned.id} should exist`).toBeDefined();
      expect(lesson?.curriculum).toMatchObject({
        familyId: 'spike-reset',
        techniqueId: 'spike-reset-positioning',
        phase: planned.phase,
      });
      expect(lesson?.mechanics).toContain('Spike 回位');
    }
  });

  it('returns the Block to its origin while leaving the player beyond it in the guide lesson', () => {
    const lesson = lessonById('spike-guide-04');
    expect(lesson).toBeDefined();
    if (!lesson) return;

    const afterReset = move(move(createGame(lesson), 'right').state, 'right').state;
    expect(afterReset.player).toEqual({ x: 3, y: 0 });
    expect(afterReset.blocks[0]?.position).toEqual({ x: 2, y: 0 });
    expect(afterReset.status).toBe('playing');
  });

  it('keeps every Spike-reset lesson playable through its intended route', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);
      expect(lesson, `${planned.id} should exist`).toBeDefined();
      if (lesson) expectWalkthroughToWin(lesson, planned.walkthrough);
    }
  });
});

describe('single-mechanic curriculum: movable Goal mode switching', () => {
  const lessons: readonly PlannedLesson[] = [
    { id: 'movable-goal-guide-07', phase: 'guide', walkthrough: ['right', 'up', 'right'] },
    { id: 'movable-goal-verify-08', phase: 'verify', walkthrough: ['right', 'right'] },
    { id: 'movable-goal-challenge-09', phase: 'challenge', walkthrough: ['right', 'right', 'up', 'right', 'down'] },
  ];

  it('ships an ordered guide, verification, and challenge trio under one Goal-state technique', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);

      expect(lesson, `${planned.id} should exist`).toBeDefined();
      expect(lesson?.curriculum).toMatchObject({
        familyId: 'movable-goal',
        techniqueId: 'goal-mode-switch',
        phase: planned.phase,
      });
      expect(lesson?.mechanics).toContain('可推动 Goal');
    }
  });

  it('lets the player cross a movable Goal when the Block beyond it prevents another push', () => {
    const lesson = lessonById('movable-goal-verify-08');
    expect(lesson).toBeDefined();
    if (!lesson) return;

    const afterCrossing = move(createGame(lesson), 'right').state;
    expect(afterCrossing.player).toEqual({ x: 1, y: 0 });
    expect(afterCrossing.goals[0]?.position).toEqual({ x: 1, y: 0 });
    expect(afterCrossing.blocks[0]?.position).toEqual({ x: 2, y: 0 });
  });

  it('keeps every movable-Goal lesson playable through its intended route', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);
      expect(lesson, `${planned.id} should exist`).toBeDefined();
      if (lesson) expectWalkthroughToWin(lesson, planned.walkthrough);
    }
  });
});

describe('single-mechanic curriculum: Gate remote pushability', () => {
  const lessons: readonly PlannedLesson[] = [
    { id: 'gate-guide-10', phase: 'guide', walkthrough: ['right', 'down', 'left'] },
    { id: 'gate-verify-11', phase: 'verify', walkthrough: ['right', 'down', 'right'] },
    {
      id: 'gate-challenge-12',
      phase: 'challenge',
      walkthrough: ['right', 'right', 'down', 'down', 'left', 'up', 'left', 'up', 'left', 'down', 'right', 'left', 'down', 'right'],
    },
  ];

  it('ships an ordered guide, verification, and challenge trio under one Gate condition technique', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);

      expect(lesson, `${planned.id} should exist`).toBeDefined();
      expect(lesson?.curriculum).toMatchObject({
        familyId: 'gate',
        techniqueId: 'gate-remote-pushability',
        phase: planned.phase,
      });
      expect(lesson?.mechanics).toContain('Gate 远端条件');
    }
  });

  it('turns a blocked Gate exit into a pushable entrance in the verification lesson', () => {
    const lesson = lessonById('gate-verify-11');
    expect(lesson).toBeDefined();
    if (!lesson) return;

    const afterPush = move(createGame(lesson), 'right').state;
    expect(afterPush.player).toEqual({ x: 1, y: 1 });
    expect(afterPush.gates.find((gate) => gate.id === 'gate-verify-entry')?.position).toEqual({ x: 2, y: 1 });
    expect(afterPush.status).toBe('playing');
  });

  it('keeps every Gate-condition lesson playable through its intended route', () => {
    for (const planned of lessons) {
      const lesson = lessonById(planned.id);
      expect(lesson, `${planned.id} should exist`).toBeDefined();
      if (lesson) expectWalkthroughToWin(lesson, planned.walkthrough);
    }
  });
});
