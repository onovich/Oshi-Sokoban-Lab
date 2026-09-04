import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { LevelSpec } from './course/types';
import { findDemoSolution } from './solver/solution-search';
import type { SolutionResult } from './solver/solution-request';

// The worker transport is a system boundary; these UI tests still run the real solver.
async function realSolution(spec: LevelSpec) {
  return findDemoSolution(spec);
}

function visibleCells() {
  return within(screen.getByRole('grid')).getAllByRole('gridcell').map((cell) => cell.getAttribute('aria-label'));
}

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('solution demonstration', () => {
  it.each([
    [{ status: 'budget-exhausted' }, '不代表关卡无解'],
    [{ status: 'proven-unsolved' }, '已搜索完'],
    [{ status: 'error' }, '暂时无法'],
    [{ status: 'solved', directions: ['up'] }, '暂时无法'],
    [{ status: 'solved', directions: ['right'] }, '暂时无法'],
  ] as const)('reports search/replay failure %j honestly and supports retry', async (failure, message) => {
    let count = 0;
    render(<App authoringMode={false} solutionLoader={async (spec) => {
      count += 1;
      return count === 1 ? failure : findDemoSolution(spec);
    }} />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '演示解法' })); });
    expect(screen.getByRole('status').textContent).toContain(message);
    expect(screen.queryByRole('button', { name: '单步' })).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '重新求解' })); });
    expect(screen.getByRole('status').textContent).toContain('0 / 2');
  });

  it('cancels pending search on exit or level change and ignores late results', async () => {
    const pending: { signal: AbortSignal; resolve: (result: SolutionResult) => void }[] = [];
    render(<App authoringMode={false} solutionLoader={(_spec, signal) => new Promise((resolve) => {
      pending.push({ signal, resolve });
    })} />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    fireEvent.click(screen.getByRole('button', { name: '演示解法' }));
    expect(screen.getByRole('status').textContent).toContain('正在求解');
    fireEvent.click(screen.getByRole('button', { name: '返回我的局面' }));
    expect(pending[0]!.signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '演示解法' }));
    await act(async () => { pending[0]!.resolve({ status: 'solved', directions: ['right', 'right'] }); });
    expect(screen.getByRole('status').textContent).toContain('正在求解');
    fireEvent.change(screen.getByLabelText('关卡'), { target: { value: 'lesson-02' } });
    expect(pending[1]!.signal.aborted).toBe(true);
    await act(async () => { pending[1]!.resolve({ status: 'solved', directions: ['right', 'right'] }); });
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.queryByRole('region', { name: '解法演示' })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('步数: 0');
  });

  it('pauses, single-steps with animation locks, and never completes the player course', async () => {
    vi.useFakeTimers();
    render(<App authoringMode={false} solutionLoader={realSolution} />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    const attempt = visibleCells();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '演示解法' })); });
    fireEvent.click(screen.getByRole('button', { name: '暂停演示' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
    expect(screen.getByRole('status').textContent).toContain('0 / 2');
    for (const key of ['ArrowRight', 'z', 'r']) fireEvent.keyDown(window, { key });
    fireEvent.click(screen.getByRole('button', { name: '单步' }));
    expect(screen.getByRole('status').textContent).toContain('1 / 2');
    expect((screen.getByRole('button', { name: '单步' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    fireEvent.click(screen.getByRole('button', { name: '单步' }));
    expect(screen.getByRole('status').textContent).not.toContain('演示完毕');
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    expect(screen.getByRole('status').textContent).toContain('演示完毕');
    expect(screen.getByText('已完成 0 / 60')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '下一关' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '重播' }));
    expect(screen.getByRole('status').textContent).toContain('0 / 2');
    for (let step = 0; step < 5; step += 1) {
      await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    }
    expect(screen.getByRole('status').textContent).toContain('演示完毕');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(visibleCells()).toEqual(attempt);
    fireEvent.keyDown(window, { key: 'z' });
    expect(screen.getByRole('status').textContent).toContain('步数: 0');
  });

  it('opens a start-position preview and returns to the unchanged player attempt', async () => {
    render(<App authoringMode={false} solutionLoader={realSolution} />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    const attempt = visibleCells();

    await act(async () => fireEvent.click(screen.getByRole('button', { name: '演示解法' })));

    const demo = screen.getByRole('region', { name: '解法演示' });
    expect(demo.textContent).toContain('从关卡起点');
    expect(within(demo).getByRole('status').textContent).toContain('0 / 2');
    expect(visibleCells()).not.toEqual(attempt);
    fireEvent.click(screen.getByRole('button', { name: '返回我的局面' }));

    expect(visibleCells()).toEqual(attempt);
    expect(screen.getByRole('status').textContent).toContain('步数: 1');
    expect(screen.getByText('已完成 0 / 60')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'z' });
    expect(screen.getByRole('status').textContent).toContain('步数: 0');
  });
});
