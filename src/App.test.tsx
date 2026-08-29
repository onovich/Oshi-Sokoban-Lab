import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('Oshi demo interface', () => {
  it('explains a lesson before exposing its puzzle and waits for the player to start', async () => {
    const user = userEvent.setup();
    render(<App />);

    const briefing = screen.getByRole('region', { name: '关卡说明' });
    expect(briefing.textContent).toMatch(/单次推送/);
    expect(briefing.textContent).toMatch(/把 Block 推进地面 Goal/);
    expect(briefing.textContent).not.toMatch(/连续向右两次/);
    expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getByRole('grid', { name: /current puzzle board/i })).toBeTruthy();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), 'fake-04');
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/让出推位/);
    expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();
  });

  it('offers a keyboard-playable board, undo control, and an accessible numbered-Goal lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /push studies/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getByRole('grid', { name: /current puzzle board/i })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status').textContent).toMatch(/步数: 1/i);

    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), 'match-03');
    await user.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getByRole('gridcell', { name: /B2.*方块/i })).toBeTruthy();
    expect(screen.getByRole('gridcell', { name: /G2.*Goal/i })).toBeTruthy();
    expect(screen.getAllByText(/B2.*G2/).length).toBeGreaterThan(0);
  });

  it('keeps a completed lesson visible and exposes an explicit next-lesson button', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByRole('status').textContent).toMatch(/已完成/);
      expect(screen.getByRole('heading', { name: /01.*单次推送/ })).toBeTruthy();
      expect(screen.getByRole('button', { name: '下一关' })).toBeTruthy();

      act(() => vi.advanceTimersByTime(1_500));

      expect(screen.getByRole('heading', { name: /01.*单次推送/ })).toBeTruthy();
      fireEvent.keyDown(window, { key: 'Enter' });
      expect(screen.getByRole('heading', { name: /01.*单次推送/ })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: '下一关' }));
      expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/02.*整体 footprint/);
      expect(screen.queryByRole('grid', { name: /current puzzle board/i })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
      expect(screen.getByRole('heading', { name: /02.*整体 footprint/ })).toBeTruthy();
      expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
