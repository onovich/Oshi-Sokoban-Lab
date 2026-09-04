import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { acceptedFoundationCatalog, masteryV2Catalog } from './course/course-catalog';
import { loadCourseProgress, saveCourseProgress } from './course/course-progress-store';
import { e06Scaffold } from './levels/lab/e06-scaffold';
import { e06Contrast, e06Prototype } from './levels/lab/e06-experiment';

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

describe('E06 playable hint entry', () => {
  it('lets the player learn by playing, preserves progress, and leaves the harder boards available', () => {
    for (const catalog of [acceptedFoundationCatalog, masteryV2Catalog]) {
      saveCourseProgress(window.localStorage, catalog, 'formal', ['lesson-01']);
    }
    render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: '课程目录' }), { target: { value: 'mastery-v2' } });
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
    expect(screen.getByRole('option', { name: /短庭/ })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: e06Scaffold.id } });
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent)
      .not.toMatch(/暂存|先把|推离|腾出|交接/);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    expect(screen.getAllByRole('gridcell', { name: /地面 Goal/ })).toHaveLength(3);
    // Independently worked five-push replay; no route is exposed in the player UI.
    const replay = ['left', 'left', 'up', 'right', 'down', 'right', 'up',
      'left', 'left', 'left', 'left', 'down', 'right', 'right'];
    for (const direction of replay) {
      fireEvent.keyDown(window, { key: `Arrow${direction[0]!.toUpperCase()}${direction.slice(1)}` });
    }
    expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    expect(document.querySelector('.lesson-description')?.textContent)
      .not.toMatch(/暂存|先把|推离|腾出|交接/);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab')).toEqual([e06Scaffold.id]);
    for (const catalog of [acceptedFoundationCatalog, masteryV2Catalog]) {
      expect(loadCourseProgress(window.localStorage, catalog, 'formal')).toEqual(['lesson-01']);
    }
    for (const spec of [e06Contrast, e06Prototype]) {
      fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: spec.id } });
      expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value).toBe(spec.id);
      expect(screen.getByRole('button', { name: '开始关卡' })).toBeTruthy();
    }
  }, 15_000);

  it('keeps the learning aid out of the formal catalog and completion counts', () => {
    render(<App authoringMode={false} />);
    expect(screen.queryByRole('option', { name: /短庭/ })).toBeNull();
    for (const catalog of [acceptedFoundationCatalog, masteryV2Catalog]) {
      expect(catalog.formalLevelOrder).not.toContain(e06Scaffold.id);
      expect(catalog.completion.fullCompletionLevelIds).not.toContain(e06Scaffold.id);
    }
  });
});
