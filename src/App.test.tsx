import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('Oshi demo interface', () => {
  it('explains a lesson before exposing its puzzle and waits for the player to start', async () => {
    const user = userEvent.setup();
    render(<App />);

    const briefing = screen.getByRole('region', { name: '关卡说明' });
    expect(briefing.textContent).toMatch(/整块占格/);
    expect(briefing.textContent).toMatch(/关卡族：整块占格/);
    expect(briefing.textContent).toMatch(/技巧组：整块落位检查/);
    expect(briefing.textContent).toMatch(/阶段：引导\/学习关/);
    expect(briefing.textContent).toMatch(/竖向两格 Block/);
    expect(briefing.textContent).not.toMatch(/向右两次/);
    expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getByRole('grid', { name: /current puzzle board/i })).toBeTruthy();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), 'occupancy-verify-02');
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/一格受阻/);
    expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();
  });

  it('offers a keyboard-playable board, undo control, and an accessible whole-occupancy lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /push studies/i })).toBeTruthy();
    expect(screen.getByText('离散回合、整块占格与可预测状态变化的推箱子实验。')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getByRole('grid', { name: /current puzzle board/i })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status').textContent).toMatch(/步数: 1/i);

    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), 'occupancy-challenge-03');
    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getAllByRole('gridcell', { name: /真实方块/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/L 形/).length).toBeGreaterThan(0);
  });

  it('keeps a completed lesson visible and exposes an explicit next-lesson button', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByRole('status').textContent).toMatch(/已完成/);
      expect(screen.getByRole('heading', { name: /01.*整块占格/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: '下一关' })).toBeTruthy();

      act(() => vi.advanceTimersByTime(1_500));

      expect(screen.getByRole('heading', { name: /01.*整块占格/ })).toBeTruthy();
      fireEvent.keyDown(window, { key: 'Enter' });
      expect(screen.getByRole('heading', { name: /01.*整块占格/ })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: '下一关' }));
      expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/02.*整块占格/);
      expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
      expect(screen.getByRole('heading', { name: /02.*整块占格/ })).toBeTruthy();
      expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ['directly', []],
    ['after moving right and left', ['ArrowRight', 'ArrowLeft']],
  ] as const)('animates an upward Gate traversal through its actual entrance and exit %s', async (_case, detour) => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), 'gate-verify-11');
    await user.click(screen.getByRole('button', { name: '开始关卡' }));

    for (const key of ['ArrowRight', 'ArrowUp', 'ArrowRight', 'ArrowRight', ...detour]) {
      fireEvent.keyDown(window, { key });
    }
    fireEvent.keyDown(window, { key: 'ArrowUp' });

    const entry = container.querySelector('[data-teleport-phase="entry"]');
    const exit = container.querySelector('[data-teleport-phase="exit"]');

    expect(entry?.getAttribute('data-motion-from')).toBe('3:1');
    expect(entry?.getAttribute('data-motion-to')).toBe('3:0');
    expect(exit?.getAttribute('data-motion-from')).toBe('2:1');
    expect(exit?.getAttribute('data-motion-to')).toBe('2:0');
  });
});
