import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { App } from './App';
import { masteryV2Catalog } from './course/course-catalog';
import { loadCourseProgress } from './course/course-progress-store';
import { rs01RainStaging } from './levels/lab/rs01-rain-staging';
import { solveLevel } from './solver/level-solver';

afterEach(cleanup);
it('offers the Rain staging candidate as LAB 31 without changing earlier numbers or formal progress', () => {
  localStorage.clear();
  render(<App initialCatalogId="mastery-v2" />);
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  expect(screen.getByRole('option', { name: /LAB 31 — 泊庭/ })).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: rs01RainStaging.id } });
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  expect(screen.getByRole('heading', { name: /LAB 31 — 泊庭/ })).toBeTruthy();
  const report = solveLevel(rs01RainStaging, { maximumStates: 80000, maximumPlans: 1 });
  const keys = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  for (const direction of report.bestPlan!.directions) fireEvent.keyDown(window, { key: keys[direction] });
  expect(screen.getByRole('status').textContent).toContain('已完成');
  expect(loadCourseProgress(localStorage, masteryV2Catalog, 'formal')).toEqual([]);
  expect(masteryV2Catalog.labLevels[29]!.id).toBe('lab-gr01-rain-landing');
  expect(screen.queryByRole('button', { name: '下一关' })).toBeNull();
}, 15000);
