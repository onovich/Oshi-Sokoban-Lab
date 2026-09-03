import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { e01Contrast, e01Prototype } from '../levels/lab/e01-experiment';
import { AuthorAnalysisPanel } from './AuthorAnalysisPanel';

afterEach(cleanup);

describe('author analysis for intentional contrasts', () => {
  it('explains why a bypassable contrast cannot use the necessary-theorem mutation audit', () => {
    render(<AuthorAnalysisPanel spec={e01Contrast} />);
    fireEvent.click(screen.getByText('AUTHOR ANALYSIS'));

    expect((screen.getByRole('button', { name: '运行删除 / 封墙变异' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/基线存在绕解或证据未完成/)).toBeTruthy();
  });

  it('still runs the complete deletion audit for a proved prototype', () => {
    render(<AuthorAnalysisPanel spec={e01Prototype} />);
    fireEvent.click(screen.getByText('AUTHOR ANALYSIS'));
    fireEvent.click(screen.getByRole('button', { name: '运行删除 / 封墙变异' }));

    expect(screen.getByText('证明关键 15 · 可读性 0 · 冗余 0 · 未决 0')).toBeTruthy();
  });
});
