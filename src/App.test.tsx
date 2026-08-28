import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('Oshi demo interface', () => {
  it('offers a keyboard-playable board, undo control, and an accessible numbered-Goal lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /push studies/i })).toBeTruthy();
    expect(screen.getByRole('grid', { name: /current puzzle board/i })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status').textContent).toMatch(/步数: 1/i);

    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), 'match-03');
    expect(screen.getByRole('gridcell', { name: /B2.*方块/i })).toBeTruthy();
    expect(screen.getByRole('gridcell', { name: /G2.*Goal/i })).toBeTruthy();
    expect(screen.getAllByText(/B2.*G2/).length).toBeGreaterThan(0);
  });

  it('keeps a completed lesson visible and exposes an explicit next-lesson button', () => {
    vi.useFakeTimers();
    try {
      render(<App />);

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
      expect(screen.getByRole('heading', { name: /02.*整体 footprint/ })).toBeTruthy();
      expect(screen.getByRole('status').textContent).toMatch(/步数: 0/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
