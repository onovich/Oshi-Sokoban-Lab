import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import type { Direction } from './engine/types';
import { courseLevels } from './levels/course-catalog';
import { analyzeLevel } from './levels/level-analyzer';

const directionKeys: Readonly<Record<Direction, string>> = {
  up: 'ArrowUp',
  right: 'ArrowRight',
  down: 'ArrowDown',
  left: 'ArrowLeft',
};

function playOptimal(levelId: string): void {
  const level = courseLevels.find((candidate) => candidate.id === levelId);
  if (!level) throw new Error(`Missing ${levelId}.`);
  const solution = analyzeLevel(level).solution;
  if (!solution) throw new Error(`No solution for ${levelId}.`);
  for (const direction of solution) {
    fireEvent.keyDown(window, { key: directionKeys[direction] });
  }
}

function openSpikeClearLesson(): void {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  playOptimal('lesson-01');
  fireEvent.click(screen.getByRole('button', { name: '下一关' }));
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  playOptimal('lesson-02');
  fireEvent.click(screen.getByRole('button', { name: /^19 / }));
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
}

describe('Oshi course interface', () => {
  it('shows only player-facing goal, controls, group, and lesson role before play', async () => {
    const user = userEvent.setup();
    render(<App />);

    const briefing = screen.getByRole('region', { name: '关卡说明' });
    expect(briefing.textContent).toMatch(/关卡组：推侧访问/);
    expect(briefing.textContent).toMatch(/阶段：建立关/);
    expect(briefing.textContent).toMatch(/胜利目标/);
    expect(briefing.textContent).not.toMatch(/开放推侧足以完成基础推动/);
    expect(briefing.textContent).not.toMatch(/提示/);
    expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getByRole('grid', { name: /current puzzle board/i })).toBeTruthy();
  });

  it('starts with only lesson 01 unlocked and derives the full course size from the catalog', () => {
    render(<App />);

    expect(screen.getAllByRole('option')).toHaveLength(63);
    expect((screen.getByRole('option', { name: /01/ }) as HTMLOptionElement).disabled).toBe(false);
    expect((screen.getByRole('option', { name: /02/ }) as HTMLOptionElement).disabled).toBe(true);
    const curriculumMap = screen.getByRole('region', { name: '课程地图' }) as HTMLDetailsElement;
    expect(curriculumMap.open).toBe(false);
    expect(screen.getByText('21 组 · 63 关 · 展开')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /建立关|定界关|推演关/ })).toHaveLength(63);
  });

  it('keeps a solved board visible and advances only through the explicit next button', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
      playOptimal('lesson-01');

      expect(screen.getByRole('status').textContent).toMatch(/已完成/);
      expect(screen.getByRole('heading', { name: /01.*推侧访问/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: '下一关' })).toBeTruthy();

      act(() => vi.advanceTimersByTime(1_500));
      expect(screen.getByRole('heading', { name: /01.*推侧访问/ })).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: '下一关' }));
      expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/02.*推侧访问/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the final Block push tween active after winning updates course progress', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    expect(screen.getByText(/已完成 1 \/ 63/)).toBeTruthy();
    const block = document.querySelector('[data-entity-id="lesson-01-block"]');
    expect(block?.getAttribute('data-motion')).toBe('moving');
    expect(block?.getAttribute('data-motion-from')).toBe('2:0');
    expect(block?.getAttribute('data-motion-to')).toBe('3:0');
  });

  it('unlocks six branches after the first boundary lesson without requiring its inference lesson', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    playOptimal('lesson-01');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    playOptimal('lesson-02');

    for (const number of ['03', '04', '16', '19', '28', '34', '40']) {
      expect(
        (screen.getByRole('button', { name: new RegExp(`^${number} `) }) as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    }
    expect(screen.getByText(/已完成 2 \/ 63/)).toBeTruthy();
  });

  it('supports keyboard play and Undo without changing course completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '开始关卡' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status').textContent).toMatch(/步数: 1/);
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/);
    expect(screen.getByText(/已完成 0 \/ 63/)).toBeTruthy();
  });

  it('locks direction input during Spike rebirth while Undo cancels it immediately', () => {
    vi.useFakeTimers();
    try {
      openSpikeClearLesson();
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(screen.getByRole('status').textContent).toMatch(/步数: 2/);
      expect(document.querySelector('[data-reset-phase="ingress"]')).toBeTruthy();
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(true);
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      expect(screen.getByRole('status').textContent).toMatch(/步数: 2/);

      fireEvent.keyDown(window, { key: 'z' });
      expect(screen.getByRole('status').textContent).toMatch(/步数: 1/);
      expect(document.querySelector('[data-reset-phase="ingress"]')).toBeNull();
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(false);

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(true);
      fireEvent.keyDown(window, { key: 'r' });
      expect(screen.getByRole('status').textContent).toMatch(/步数: 0/);
      expect(document.querySelector('[data-reset-phase="ingress"]')).toBeNull();
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(false);

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(true);
      act(() => vi.advanceTimersByTime(619));
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(false);
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the short contact-flash window when reduced motion is requested', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    try {
      openSpikeClearLesson();
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(true);
      act(() => vi.advanceTimersByTime(79));
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect((screen.getByRole('button', { name: 'Move up' }) as HTMLButtonElement).disabled).toBe(false);
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});
