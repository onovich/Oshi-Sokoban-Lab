import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { App } from './App';
import { masteryV2Catalog } from './course/course-catalog';
import { gc01GoalReturn } from './levels/lab/gc01-goal-return';

afterEach(cleanup);

it('offers the Goal candidate separately while retaining existing laboratory IDs and numbers', () => {
  window.localStorage.clear();
  render(<App initialCatalogId="mastery-v2" />);
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  const picker = screen.getByRole('combobox', { name: '关卡' });
  const candidates = within(picker).getByRole('group', { name: '新候选 · Goal 空间协调（待试玩）' });
  expect(within(candidates).getByRole('option', { name: 'LAB 28 — 涉岸' })).toBeTruthy();
  fireEvent.change(picker, { target: { value: gc01GoalReturn.id } });
  expect(screen.getByRole('heading', { name: 'LAB 28 — 涉岸' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  expect(screen.getByRole('button', { name: '演示解法' })).toBeTruthy();
  expect(masteryV2Catalog.labLevels[24]!.id).toBe('lab-e05-shared-bridge');
  expect(masteryV2Catalog.levels).toHaveLength(70);
  expect(masteryV2Catalog.formalLevelOrder).not.toContain(gc01GoalReturn.id);
});
