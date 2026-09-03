import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { acceptedFoundationCatalog, masteryV2Catalog } from './course/course-catalog';
import { loadCourseProgress } from './course/course-progress-store';
import { e06Contrast, e06Prototype } from './levels/lab/e06-experiment';
import { searchSpatialExperiment } from './levels/lab/spatial-experiment-search';
import { createGame } from './engine/game-engine';

afterEach(cleanup);

describe('E06 developer playtest entry', () => {
  beforeEach(() => window.localStorage.clear());

  it('offers the new experiment and sequential contrast only in the isolated laboratory', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: '课程目录' }), { target: { value: 'mastery-v2' } });
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
    expect(screen.getByRole('option', { name: /回环/ })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: e06Prototype.id } });
    const briefing = screen.getByRole('region', { name: '关卡说明' }).textContent;
    expect(briefing).not.toMatch(/交接|暂存|让路|先完成|撤回/);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    const replay = searchSpatialExperiment(createGame(e06Prototype.board));
    expect(replay.status).toBe('solved');
    for (const direction of replay.solution!) {
      fireEvent.keyDown(window, { key: `Arrow${direction[0]!.toUpperCase()}${direction.slice(1)}` });
    }
    expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab')).toEqual([e06Prototype.id]);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    expect(loadCourseProgress(window.localStorage, acceptedFoundationCatalog, 'formal')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value).toBe(e06Contrast.id);
  }, 15_000);

  it('does not add experiments to production navigation or formal completion', () => {
    render(<App authoringMode={false} />);
    expect(screen.queryByRole('combobox', { name: '课程区域' })).toBeNull();
    expect(screen.queryByRole('option', { name: /回环|旁路/ })).toBeNull();
    for (const catalog of [acceptedFoundationCatalog, masteryV2Catalog]) {
      expect(catalog.formalLevelOrder).not.toContain(e06Prototype.id);
      expect(catalog.completion.fullCompletionLevelIds).not.toContain(e06Contrast.id);
    }
  });
});
