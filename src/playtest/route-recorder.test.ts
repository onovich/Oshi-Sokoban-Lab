import { expect, it } from 'vitest';
import { RouteRecorder, ROUTE_STORAGE_KEY } from './route-recorder';
import { createGame, move, undo, restart } from '../engine/game-engine';
import { e05SharedBridge } from '../levels/lab/e05-shared-bridge';

it('preserves the entire attempt including blocked input, undo, restart and demo separately across reload', () => {
  localStorage.clear();
  const recorder = new RouteRecorder(localStorage);
  const initial = createGame(e05SharedBridge.board);
  recorder.begin('mastery-v2/lab', initial);
  const result = move(initial, 'up');
  recorder.record({ type: 'move', direction: 'up', source: 'manual', outcome: 'moved' }, result.state);
  recorder.record({ type: 'undo', source: 'manual' }, undo(result.state));
  recorder.record({ type: 'restart', source: 'manual' }, restart(initial));
  recorder.record({ type: 'move', direction: 'down', source: 'manual', outcome: 'blocked' }, initial);
  recorder.record({ type: 'demo-start', source: 'demo' }, initial);
  recorder.record({ type: 'move', direction: 'up', source: 'demo', outcome: 'moved' }, result.state);
  recorder.record({ type: 'demo-end', source: 'demo' }, initial);
  const data = JSON.parse(new RouteRecorder(localStorage).export());
  expect(data.sessions[0].entries.map((entry: { action: {type: string} }) => entry.action.type))
    .toEqual(['move', 'undo', 'restart', 'move', 'demo-start', 'move', 'demo-end']);
  expect(data.sessions[0].board).toEqual(e05SharedBridge.board);
  expect(data.sessions[0].entries[0].state.player).toEqual({ x: 2, y: 0 });
  expect(data.sessions[0].entries[1].state.player).toEqual({ x: 2, y: 1 });
  expect(recorder.export()).not.toMatch(/remainingSeconds/);
});

it('timestamps every new action while preserving legacy records without invented times', () => {
  localStorage.clear();
  const initial = createGame(e05SharedBridge.board);
  const { level: _level, history: _history, remainingSeconds: _seconds, ...legacyState } = initial;
  const legacy = { id: 'legacy', context: 'test/lab', board: initial.level, initial: legacyState,
    entries: [{ action: { type: 'restart', source: 'manual' }, state: legacyState }] };
  localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify({ version: 1, sessions: [legacy] }));
  let time = 1790000000000;
  const recorder = new RouteRecorder(localStorage, () => time);
  recorder.begin('test/lab', initial);
  const actions = [
    { type: 'move', direction: 'up', source: 'manual', outcome: 'blocked' },
    { type: 'undo', source: 'manual' }, { type: 'restart', source: 'manual' },
    { type: 'demo-start', source: 'demo' },
    { type: 'move', direction: 'right', source: 'demo', outcome: 'moved' },
    { type: 'demo-end', source: 'demo' },
  ] as const;
  for (const action of actions) { recorder.record(action, initial); time += 2500; }
  const sessions = JSON.parse(new RouteRecorder(localStorage).export()).sessions;
  expect(sessions[0]).toEqual(legacy);
  expect(sessions[1].entries.map((entry: { timestampMs: number }) => entry.timestampMs))
    .toEqual([1790000000000, 1790000002500, 1790000005000, 1790000007500, 1790000010000, 1790000012500]);
});

it('keeps records exportable when storage is full and does not overwrite unreadable older data', () => {
  const initial = createGame(e05SharedBridge.board);
  const full = new RouteRecorder({ getItem: () => null, setItem: () => { throw new Error('quota'); } });
  full.begin('test/lab', initial);
  full.record({ type: 'restart', source: 'manual' }, initial);
  expect(full.saved).toBe(false);
  expect(JSON.parse(full.export()).sessions[0].entries).toHaveLength(1);
  localStorage.setItem('oshi.playtest.routes.v1', 'unreadable');
  const damaged = new RouteRecorder(localStorage);
  damaged.begin('test/lab', initial);
  expect(localStorage.getItem('oshi.playtest.routes.v1')).toBe('unreadable');
  expect(damaged.saved).toBe(false);
});

it('preserves both tabs when they alternately append inputs', () => {
  localStorage.clear();
  const one = new RouteRecorder(localStorage);
  const two = new RouteRecorder(localStorage);
  const initial = createGame(e05SharedBridge.board);
  one.begin('one/lab', initial);
  two.begin('two/lab', initial);
  one.record({ type: 'restart', source: 'manual' }, initial);
  two.record({ type: 'undo', source: 'manual' }, initial);
  const sessions = JSON.parse(new RouteRecorder(localStorage).export()).sessions;
  expect(sessions.map((session: {context: string}) => session.context)).toEqual(['one/lab', 'two/lab']);
  expect(sessions.map((session: {entries: unknown[]}) => session.entries.length)).toEqual([1, 1]);
});

it('clears only routes and lets a stale tab continue without resurrecting old attempts', () => {
  localStorage.clear();
  localStorage.setItem('progress', 'keep');
  const one = new RouteRecorder(localStorage);
  const two = new RouteRecorder(localStorage);
  const initial = createGame(e05SharedBridge.board);
  two.begin('two/lab', initial);
  const moved = move(initial, 'up').state;
  two.record({ type: 'move', direction: 'up', source: 'manual', outcome: 'moved' }, moved);
  expect(one.clear()).toBe(true);
  expect(new RouteRecorder(localStorage).count).toBe(0);
  expect(localStorage.getItem('progress')).toBe('keep');
  two.record({ type: 'undo', source: 'manual' }, initial);
  const data = JSON.parse(two.export());
  expect(data.sessions).toHaveLength(1);
  expect(data.sessions[0].initial.player).toEqual(moved.player);
  expect(data.sessions[0].entries).toHaveLength(1);
  expect(one.clear()).toBe(true);
  expect(JSON.parse(two.export()).sessions).toEqual([]);
});

it('retains exportable data if clearing storage fails, and can explicitly clear damaged data', () => {
  localStorage.clear();
  let fail = false;
  const recorder = new RouteRecorder({
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => { if (fail) throw new Error('quota'); localStorage.setItem(key, value); },
  });
  recorder.begin('test/lab', createGame(e05SharedBridge.board));
  const before = recorder.export();
  fail = true;
  expect(recorder.clear()).toBe(false);
  expect(recorder.export()).toBe(before);
  expect(recorder.saved).toBe(false);
  localStorage.setItem(ROUTE_STORAGE_KEY, 'damaged');
  const damaged = new RouteRecorder(localStorage);
  expect(damaged.clear()).toBe(true);
  expect(damaged.saved).toBe(true);
  expect(new RouteRecorder(localStorage).count).toBe(0);
});
