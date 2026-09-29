import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

it('opens a targeted player-only lab without author metadata or solution controls', () => {
  render(<App initialCatalogId="mastery-v2" initialLevelId="lab-ba1-return-passage" blindPlaytest />);
  expect(screen.queryByLabelText('关卡验收')).toBeNull();
  expect(screen.queryByRole('region', { name: '作者分析' })).toBeNull();
  expect(screen.queryByRole('combobox', { name: '关卡' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'LAB 41 — 折廊' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  expect(screen.queryByRole('button', { name: '演示解法' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Move up' })).toBeTruthy();
});

it('distinguishes final author acceptance from pending review without using completion progress', () => {
  window.localStorage.clear();
  render(<App initialCatalogId="mastery-v2" />);
  expect(screen.getByLabelText('关卡验收').textContent).toContain('作者验收通过');
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: 'lab-rs10-self-stop-bank' } });
  expect(screen.getByLabelText('关卡验收').textContent).toContain('待验收');
});
