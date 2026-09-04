import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { acceptedFoundationCatalog } from '../course/course-catalog';
import { buildSolutionReplay } from '../rendering/solution-replay';
import { findDemoSolution } from '../solver/solution-search';
import { SolutionDemo } from './SolutionDemo';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('solution event presentation', () => {
  it('shows only the final player after a reduced-motion Gate step, without waiting for travel', async () => {
    vi.useFakeTimers();
    const spec = acceptedFoundationCatalog.levels.find((level) => level.id === 'lesson-40')!;
    const result = findDemoSolution(spec);
    if (result.status !== 'solved') throw new Error(result.status);
    await act(async () => {
      render(<SolutionDemo loadSolution={async () => result} onExit={() => {}} reducedMotion spec={spec} />);
    });
    fireEvent.click(screen.getByRole('button', { name: '暂停演示' }));
    fireEvent.click(screen.getByRole('button', { name: '单步' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(document.querySelector('[data-teleport-phase="entry"]')).toBeNull();
    expect(document.querySelectorAll('.board__entity--player')).toHaveLength(1);
    expect((screen.getByRole('button', { name: '单步' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([
    ['lesson-22', 'object-reset', 820, false],
    ['lesson-22', 'object-reset', 80, true],
    ['lesson-40', 'gate-traversed', 364, false],
  ] as const)('finishes %s %s animation before another step (%sms, reduced=%s)', async (id, eventType, duration, reducedMotion) => {
    vi.useFakeTimers();
    const spec = acceptedFoundationCatalog.levels.find((level) => level.id === id)!;
    const result = findDemoSolution(spec);
    if (result.status !== 'solved') throw new Error(result.status);
    const frames = buildSolutionReplay(spec.board, result.directions);
    const eventIndex = frames.findIndex((frame) => frame.events.some((event) => event.type === eventType));
    expect(eventIndex).toBeGreaterThan(0);
    await act(async () => {
      render(<SolutionDemo loadSolution={async () => result} onExit={() => {}} reducedMotion={reducedMotion} spec={spec} />);
    });
    fireEvent.click(screen.getByRole('button', { name: '暂停演示' }));
    for (let index = 1; index <= eventIndex; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: '单步' }));
      if (index < eventIndex) await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    }
    if (eventType === 'object-reset') {
      expect(document.querySelectorAll('.board__reset-particle')).toHaveLength(12);
      expect(document.querySelector('[data-reset-phase="ingress"]')).toBeTruthy();
      expect(document.querySelector('[data-reset-phase="respawn"]')).toBeTruthy();
    } else {
      expect(document.querySelector('[data-teleport-phase="entry"]')).toBeTruthy();
      expect(document.querySelector('[data-teleport-phase="exit"]')).toBeTruthy();
    }
    await act(async () => { await vi.advanceTimersByTimeAsync(duration - 1); });
    expect((screen.getByRole('button', { name: '单步' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect((screen.getByRole('button', { name: '单步' }) as HTMLButtonElement).disabled).toBe(false);
    if (eventType === 'object-reset') expect(document.querySelector('[data-reset-phase="ingress"]')).toBeNull();
  });
});
