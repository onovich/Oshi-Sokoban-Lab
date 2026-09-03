import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { acceptedFoundationCatalog, masteryV2Catalog } from './course/course-catalog';
import { loadCourseProgress } from './course/course-progress-store';
import { e01Contrast, e01Prototype } from './levels/lab/e01-experiment';
import { solveLevel } from './solver/level-solver';

describe('E01 developer playtest entry', () => {
  beforeEach(() => window.localStorage.clear());

  it('plays the prototype and its contrast in the mastery lab without adding formal progress', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: '课程目录' }), {
      target: { value: 'mastery-v2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), {
      target: { value: 'lab' },
    });

    const option = screen.getByRole('option', { name: /折线/ });
    expect((option as HTMLOptionElement).disabled).toBe(false);
    fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), {
      target: { value: e01Prototype.id },
    });
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent)
      .not.toMatch(/暂存|保留推侧|独立绕行/);
    fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
    for (const direction of solveLevel(e01Prototype).bestPlan!.directions) {
      fireEvent.keyDown(window, { key: `Arrow${direction[0]!.toUpperCase()}${direction.slice(1)}` });
    }

    expect(screen.getByRole('status').textContent).toMatch(/已完成/);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    expect(loadCourseProgress(window.localStorage, acceptedFoundationCatalog, 'formal')).toEqual([]);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab')).toEqual([e01Prototype.id]);

    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe(e01Contrast.id);
    expect(screen.getByRole('region', { name: '关卡说明' }).textContent).toMatch(/对照/);
  });
});
