import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { masteryV2Catalog } from './course/course-catalog';
import { saveCourseProgress } from './course/course-progress-store';
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
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), {
    target: { value: 'lab' },
  });
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
}

describe('Oshi course interface', () => {
  beforeEach(() => window.localStorage.clear());

  it('lets developers switch catalogs and enter the isolated Spike laboratory', () => {
    render(<App />);

    expect(screen.getByRole('combobox', { name: '课程目录' })).toBeTruthy();
    expect(screen.getByRole('region', { name: '作者分析' })).toBeTruthy();
    expect(screen.getByText(/求解：solved/)).toBeTruthy();
    expect(screen.getAllByRole('option', { name: /Gate × Spike/ })).toHaveLength(3);

    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), {
      target: { value: 'lab' },
    });

    expect(screen.getAllByRole('option')).toHaveLength(3 + 2 + 2);
    expect(screen.getByRole('option', { name: /Spike.*清除/ })).toBeTruthy();
    expect(screen.getByText(/实验室进度 0 \/ 3/)).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: '课程目录' }), {
      target: { value: 'mastery-v2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), {
      target: { value: 'formal' },
    });

    expect(screen.getByText(/当前 70 关 \/ 目标 120 关/)).toBeTruthy();
    expect(screen.getByText(/基础结业 \d+\/\d+ · 主线结局 \d+\/3 · 100% \d+\/120/)).toBeTruthy();
    expect(screen.getByText(/目标 D[1-3]/)).toBeTruthy();
    expect(screen.getByRole('option', { name: '31 — 回身余地' })).toBeTruthy();
    expect(screen.getByRole('option', { name: /70 — Spike：另一边/ })).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
      target: { value: 'mastery-push-footprint-01' },
    });
    const masteryAnalysis = screen.getByRole('region', { name: '作者分析' });
    expect(masteryAnalysis.textContent).toMatch(/目标难度D3/);
    expect(masteryAnalysis.textContent).toMatch(/实测难度未校准/);
    expect(masteryAnalysis.textContent).toMatch(/最优窗口内的宏策略/);
    for (const act of ['I · 语法', 'II · 熟练', 'III · 反转', 'IV · 综合', 'V · 峰顶']) {
      expect(screen.getByRole('heading', { name: act })).toBeTruthy();
    }
  });
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

  it('allows any lesson to be selected by default in development', () => {
    render(<App />);

    const finalOption = screen.getByRole('option', { name: /^60 — Gate × Spike/ }) as HTMLOptionElement;
    const finalMapButton = screen.getByRole('button', { name: /^60 / }) as HTMLButtonElement;
    expect(finalOption.disabled).toBe(false);
    expect(finalMapButton.disabled).toBe(false);

    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
      target: { value: 'lesson-63' },
    });

    expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/60.*Gate × Spike/);
    expect(screen.getByText(/已完成 0 \/ 60/)).toBeTruthy();
  });

  it('keeps progression locks available for the player course and derives its size from the catalog', () => {
    render(<App authoringMode={false} lessonAccessMode="progression" />);

    expect(screen.getAllByRole('option')).toHaveLength(60);
    expect((screen.getByRole('option', { name: /01/ }) as HTMLOptionElement).disabled).toBe(false);
    expect((screen.getByRole('option', { name: /02/ }) as HTMLOptionElement).disabled).toBe(true);
    const curriculumMap = screen.getByRole('region', { name: '课程地图' }) as HTMLDetailsElement;
    expect(curriculumMap.open).toBe(false);
    expect(screen.getByText('20 组 · 60 关 · 展开')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /建立关|定界关|推演关/ })).toHaveLength(60);
    expect(screen.queryByText(/目标 D/)).toBeNull();
    expect(screen.queryByRole('region', { name: '作者分析' })).toBeNull();
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

  it.each([false, true])('advances from freely selected mastery lesson 31 to 32 without prerequisites (32 completed: %s)', (nextAlreadyCompleted) => {
    if (nextAlreadyCompleted) {
      saveCourseProgress(window.localStorage, masteryV2Catalog, 'formal', ['mastery-push-footprint-02']);
    }
    render(<App initialCatalogId="mastery-v2" lessonAccessMode="free" />);
    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
      target: { value: 'mastery-push-footprint-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));

    for (const key of [
      'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowLeft',
    ]) {
      fireEvent.keyDown(window, { key });
    }

    expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));

    expect(screen.getByRole('region', { name: '关卡说明' }).textContent)
      .toMatch(/32 — 门留下的格子/);
  });

  it('advances sequentially across groups in free mode with earlier lessons unfinished', () => {
    render(<App lessonAccessMode="free" />);
    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
      target: { value: 'lesson-03' },
    });
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    playOptimal('lesson-03');

    expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));

    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe('lesson-04');
  });

  it.each(['free', 'progression'] as const)('ends lab navigation without wrapping or claiming full completion (access: %s)', (lessonAccessMode) => {
    vi.useFakeTimers();
    try {
      render(<App lessonAccessMode={lessonAccessMode} />);
      fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), {
        target: { value: 'lab' },
      });
      fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
        target: { value: 'lab-spike-progress' },
      });
      fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));

      for (const key of ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowUp']) {
        fireEvent.keyDown(window, { key });
        act(() => vi.advanceTimersByTime(1_000));
      }

      expect(screen.getByRole('status').textContent).toMatch(/已完成/);
      expect(screen.getByText(/实验室进度 1 \/ 3/)).toBeTruthy();
      expect(screen.queryByRole('button', { name: '下一关' })).toBeNull();
      expect(screen.queryByText(/已完成当前区域全部关卡/)).toBeNull();
      expect(screen.getByText(/已到本组末尾/)).toBeTruthy();
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
    expect(screen.getByText(/已完成 1 \/ 60/)).toBeTruthy();
    const block = document.querySelector('[data-entity-id="lesson-01-block"]');
    expect(block?.getAttribute('data-motion')).toBe('moving');
    expect(block?.getAttribute('data-motion-from')).toBe('2:0');
    expect(block?.getAttribute('data-motion-to')).toBe('3:0');
  });

  it('unlocks six branches after the first boundary lesson without requiring its inference lesson', () => {
    render(<App lessonAccessMode="progression" />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    playOptimal('lesson-01');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    playOptimal('lesson-02');

    for (const number of ['03', '04', '16', '19', '25', '31', '37']) {
      expect(
        (screen.getByRole('button', { name: new RegExp(`^${number} `) }) as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    }
    expect(screen.getByText(/已完成 2 \/ 60/)).toBeTruthy();
  });

  it('supports keyboard play and Undo without changing course completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '开始关卡' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status').textContent).toMatch(/步数: 1/);
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/);
    expect(screen.getByText(/已完成 0 \/ 60/)).toBeTruthy();
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
      act(() => vi.advanceTimersByTime(819));
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
