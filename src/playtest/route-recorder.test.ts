import { expect, it } from 'vitest';
import { RouteRecorder } from './route-recorder';
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
  expect(recorder.export()).not.toMatch(/timestamp|elapsed|duration|remainingSeconds/);
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
