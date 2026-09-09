import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { App } from './App';
import { masteryV2Catalog } from './course/course-catalog';
import { gc01GoalReturn } from './levels/lab/gc01-goal-return';

afterEach(cleanup);

it('offers 雨岸 as a separate Rain branch without changing the Goal pair order', () => {
  window.localStorage.clear();
  render(<App initialCatalogId="mastery-v2" />);
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  const picker = screen.getByRole('combobox', { name: '关卡' });
  const branch = within(picker).getByRole('group', { name: '新候选 · Goal × Rain（待试玩）' });
  expect(within(branch).getByRole('option', { name: 'LAB 30 — 雨岸' })).toBeTruthy();
  fireEvent.change(picker, { target: { value: 'lab-gr01-rain-landing' } });
  expect(screen.getByRole('heading', { name: 'LAB 30 — 雨岸' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  expect(screen.getByRole('button', { name: '演示解法' })).toBeTruthy();
  expect(masteryV2Catalog.formalLevelOrder).not.toContain('lab-gr01-rain-landing');
});

it('offers the related Goal experiment after 涉岸 without adding a formal level', () => {
  window.localStorage.clear();
  render(<App initialCatalogId="mastery-v2" />);
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  const picker = screen.getByRole('combobox', { name: '关卡' });
  expect(within(picker).getByRole('option', { name: 'LAB 29 — 转岸' })).toBeTruthy();
  fireEvent.change(picker, { target: { value: 'lab-gc03-goal-handoff' } });
  expect(screen.getByRole('heading', { name: 'LAB 29 — 转岸' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  expect(screen.getByRole('button', { name: '演示解法' })).toBeTruthy();
  expect(masteryV2Catalog.formalLevelOrder).not.toContain('lab-gc03-goal-handoff');
});

it('offers the Goal candidate separately while retaining existing laboratory IDs and numbers', () => {
  window.localStorage.clear();
  render(<App initialCatalogId="mastery-v2" />);
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  const picker = screen.getByRole('combobox', { name: '关卡' });
  const candidates = within(picker).getByRole('group', { name: 'Goal 空间协调 · 转岸 → 涉岸' });
  expect(within(candidates).getByRole('option', { name: 'LAB 28 — 涉岸' })).toBeTruthy();
  fireEvent.change(picker, { target: { value: gc01GoalReturn.id } });
  expect(screen.getByRole('heading', { name: 'LAB 28 — 涉岸' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  expect(screen.getByRole('button', { name: '演示解法' })).toBeTruthy();
  expect(masteryV2Catalog.labLevels[24]!.id).toBe('lab-e05-shared-bridge');
  expect(masteryV2Catalog.levels).toHaveLength(70);
  expect(masteryV2Catalog.formalLevelOrder).not.toContain(gc01GoalReturn.id);
});
