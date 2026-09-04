import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { acceptedFoundationCatalog, masteryV2Catalog } from './course/course-catalog';
import { loadCourseProgress, saveCourseProgress } from './course/course-progress-store';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function selectLab(id: string) {
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: id } });
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
}

function play(route: string) {
  const keys: Record<string, string> = { U: 'ArrowUp', R: 'ArrowRight', D: 'ArrowDown', L: 'ArrowLeft' };
  for (const key of route) fireEvent.keyDown(window, { key: keys[key]! });
}

describe('laboratory learning and author ratings', () => {
  it('appends the return-loan transfer without changing the existing lab order or formal progress', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'lab', ['lab-e02-shared-bay', 'lab-e02-independent-bay']);
    render(<App initialCatalogId="mastery-v2" />);
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
    const options = within(screen.getByRole('combobox', { name: '关卡' })).getAllByRole('option') as HTMLOptionElement[];
    expect(options.slice(-3).map((option) => option.value)).toEqual([
      'lab-e02-shared-bay', 'lab-e02-independent-bay', 'lab-e02-return-loan',
    ]);
    selectLab('lab-e02-return-loan');
    expect(screen.getAllByRole('gridcell', { name: /地面 Goal/ })).toHaveLength(5);
    expect(document.querySelector('.lesson-description')?.textContent).not.toMatch(/返回|先把|取回|交接/);
    play('UDLDDRRRUULUULLDRDLDDRRRULDLUUUDDRRULL');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab')).toEqual([
      'lab-e02-shared-bay', 'lab-e02-independent-bay', 'lab-e02-return-loan',
    ]);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    expect(masteryV2Catalog.formalLevelOrder).not.toContain('lab-e02-return-loan');
    expect(acceptedFoundationCatalog.labLevels.some((spec) => spec.id === 'lab-e02-return-loan')).toBe(false);
  }, 15_000);

  it('keeps old stable-ID completions and advances short court to bypass with author-only ratings', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'lab', ['lab-e06-interleaved']);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e06-small-court');
    expect(within(screen.getByRole('region', { name: '作者工具' })).getByText(/作者 D4/)).toBeTruthy();
    play('LLURDRULLLLDRR');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe('lab-e06-independent-return');
    expect(within(screen.getByRole('region', { name: '作者工具' })).getByText(/作者 D5/)).toBeTruthy();
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab'))
      .toEqual(['lab-e06-interleaved', 'lab-e06-small-court']);
  }, 15_000);

  it('makes both E02 candidates freely playable without adding formal progress or explaining the trick', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'formal', ['lesson-01']);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e02-shared-bay');
    expect(screen.getAllByRole('gridcell', { name: /地面 Goal/ })).toHaveLength(4);
    expect(document.querySelector('.lesson-description')?.textContent).not.toMatch(/暂存|先把|取回|交接/);
    play('RURRDDRDDLLLUDRRRULUUULLLDRRURDLDRDDLUUU');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe('lab-e02-independent-bay');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual(['lesson-01']);
    for (const catalog of [masteryV2Catalog, acceptedFoundationCatalog]) {
      expect(catalog.levels.some((level) => level.id.startsWith('lab-e02'))).toBe(false);
      expect(catalog.formalLevelOrder.some((id) => id.startsWith('lab-e02'))).toBe(false);
    }
  }, 15_000);
});
