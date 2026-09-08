import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { PlaytestApp } from './PlaytestApp';

describe('player-only playtest entry', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('offers the playable mastery lessons without author-only information', () => {
    render(<PlaytestApp />);

    const option = screen.getByRole('option', { name: '31 — 回身余地' }) as HTMLOptionElement;
    expect(option.disabled).toBe(false);
    expect(screen.queryByRole('region', { name: '作者分析' })).toBeNull();
    expect(screen.queryByRole('region', { name: '作者工具' })).toBeNull();
    expect(screen.queryByText(/目标 D|目标难度|实测难度|最优窗口内的宏策略/)).toBeNull();

    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
      target: { value: 'mastery-push-footprint-01' },
    });
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/胜利目标/);
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/方向键/);
  });

  it('keeps test progress in its tab without changing the regular player save', () => {
    const playtest = render(<PlaytestApp />);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/已完成 1 \/ 70/)).toBeTruthy();
    playtest.unmount();

    const reopenedPlaytest = render(<PlaytestApp />);
    expect(screen.getByText(/已完成 1 \/ 70/)).toBeTruthy();
    reopenedPlaytest.unmount();

    render(<App authoringMode={false} initialCatalogId="mastery-v2" lessonAccessMode="free" />);
    expect(screen.getByText(/已完成 0 \/ 70/)).toBeTruthy();
  });
});
