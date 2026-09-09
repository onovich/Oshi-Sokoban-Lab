import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function exported() {
  const link = screen.getByRole('link', { name: '导出完整路线' });
  return JSON.parse(decodeURIComponent(link.getAttribute('href')!.split(',')[1]!));
}

it('confirms route deletion without changing the board and records subsequent actions from that board', () => {
  localStorage.clear();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  const before = exported();
  const nativeConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: '清除路线数据' }));
  expect(screen.getByRole('group', { name: '确认清除路线' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '取消清除' }));
  expect(exported()).toEqual(before);
  fireEvent.click(screen.getByRole('button', { name: '清除路线数据' }));
  fireEvent.click(screen.getByRole('button', { name: '确认清除' }));
  expect(exported().sessions).toEqual([]);
  expect(screen.getByText(/完整路线：0 条操作/)).toBeTruthy();
  expect(nativeConfirm).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: 'z' });
  const session = exported().sessions[0];
  expect(session.initial).toEqual(before.sessions[0].entries[0].state);
  expect(session.entries[0].action.type).toBe('undo');
  expect(session.entries[0].state.player).toEqual(before.sessions[0].initial.player);
});

it('exports real inputs, keeps undo branches and separates sessions when selecting another level', () => {
  localStorage.clear();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  fireEvent.keyDown(window, { key: 'z' });
  fireEvent.keyDown(window, { key: 'r' });
  const entries = exported().sessions[0].entries;
  expect(entries.map((entry: {action: {type: string}}) => entry.action.type)).toEqual(['move','move','undo','restart']);
  expect(entries[0].action.outcome).toBe('blocked');
  fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: 'lesson-02' } });
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(exported().sessions).toHaveLength(2);
  expect(exported().sessions[0].entries).toHaveLength(4);
});

it('records only demonstrated steps actually viewed and preserves the manual board on exit', async () => {
  localStorage.clear();
  render(<App solutionLoader={async () => ({ status: 'solved', directions: ['right', 'right'] })} />);
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  fireEvent.click(screen.getByRole('button', { name: '演示解法' }));
  fireEvent.click(await screen.findByRole('button', { name: '暂停演示' }));
  fireEvent.click(screen.getByRole('button', { name: '单步' }));
  fireEvent.click(screen.getByRole('button', { name: '重播' }));
  fireEvent.click(screen.getByRole('button', { name: '返回我的局面' }));
  const entries = exported().sessions[0].entries;
  expect(entries.map((entry: {action: {type: string; source: string}}) => `${entry.action.source}:${entry.action.type}`))
    .toEqual(['manual:move', 'demo:demo-start', 'demo:move', 'demo:restart', 'demo:demo-end']);
  expect(entries[4].state).toEqual(entries[0].state);
});
