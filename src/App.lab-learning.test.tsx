import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { acceptedFoundationCatalog, masteryV2Catalog } from './course/course-catalog';
import { loadCourseProgress, saveCourseProgress } from './course/course-progress-store';
import { e03GoalSpaceLevels } from './levels/lab/e03-goal-space';
import { searchSpatialExperiment } from './levels/lab/spatial-experiment-search';
import { createGame } from './engine/game-engine';
import { e04SharedCourt } from './levels/lab/e04-shared-staging';
import { e04TeachingLevels } from './levels/lab/e04-teaching';
import { e04UpperRoute } from './levels/lab/e04-upper-route';
import { e04SideRoute } from './levels/lab/e04-side-route';
import { e05SharedGoals } from './levels/lab/e05-shared-goals';
import { e05ReturnRoute } from './levels/lab/e05-return-route';
import { e05GoalHandoff } from './levels/lab/e05-goal-handoff';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function selectLab(id: string) {
  fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
  fireEvent.change(screen.getByRole('combobox', { name: '关卡' }), { target: { value: id } });
  fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
}

function play(route: string) {
  const keys: Record<string, string> = { U: 'ArrowUp', R: 'ArrowRight', D: 'ArrowDown', L: 'ArrowLeft' };
  for (const key of route) fireEvent.keyDown(window, { key: keys[key]! });
}

describe('laboratory learning and author ratings', () => {
  it('separates preserved learning chains from archived experiments without renumbering them', () => {
    render(<App initialCatalogId="mastery-v2" />);
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
    const picker = screen.getByRole('combobox', { name: '关卡' });
    expect(within(picker).getByRole('group', { name: '保留教学链 A · D4 → D5 → D6' })).toBeTruthy();
    const archive = within(picker).getByRole('group', { name: /历史实验/ });
    expect(within(archive).getByRole('option', { name: /LAB 16 — 西庭/ })).toBeTruthy();
    expect((picker as HTMLSelectElement).value).toBe('lab-e06-small-court');
  });
  it('shows the route-pair author ratings separately from original design targets', () => {
    render(<App initialCatalogId="mastery-v2" />);
    for (const [id, rating, target] of [
      ['lab-e05-lower-landing', 6, 4],
      ['lab-e05-upper-landing', 7, 5],
    ] as const) {
      selectLab(id);
      expect(within(screen.getByRole('region', { name: '作者工具' })).getByText(new RegExp(`作者 D${rating}`))).toBeTruthy();
      const difficulty = masteryV2Catalog.labLevels.find(level => level.id === id)!.difficulty;
      expect(difficulty.target).toBe(target);
      expect(difficulty.sampleSize).toBe(0);
    }
  });
  it('plays the route-informed contrast pair in order without changing existing lab numbers or formal progress', () => {
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e05-lower-landing');
    expect(screen.getByRole('heading', { name: /LAB 26 — 临庭/ })).toBeTruthy();
    for (const id of ['lab-e05-lower-landing', 'lab-e05-upper-landing']) {
      const spec = masteryV2Catalog.labLevels.find(level => level.id === id)!;
      const report = searchSpatialExperiment(createGame(spec.board));
      expect(report.status).toBe('solved');
      const letters = { up: 'U', down: 'D', left: 'L', right: 'R' };
      play(report.solution!.map(direction => letters[direction]).join(''));
      expect(screen.getByRole('status').textContent).toContain('已完成');
      if (id === 'lab-e05-lower-landing') {
        fireEvent.click(screen.getByRole('button', { name: '下一关' }));
        fireEvent.click(screen.getByRole('button', { name: '开始关卡' }));
        expect(screen.getByRole('heading', { name: /LAB 27 — 望庭/ })).toBeTruthy();
      }
    }
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    expect(masteryV2Catalog.labLevels[24]!.id).toBe('lab-e05-shared-bridge');
  }, 30000);
  it('keeps archived precursors playable but no longer routes their ending into the hard challenge', () => {
    saveCourseProgress(window.localStorage,masteryV2Catalog,'lab',[e05SharedGoals.id]);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab(e05ReturnRoute.id);
    expect(screen.getByRole('heading',{name:/LAB 22 — 汀庭/})).toBeTruthy();
    for(const lesson of [e05ReturnRoute,e05GoalHandoff]) {
      expect((screen.getByRole('combobox',{name:'关卡'}) as HTMLSelectElement).value).toBe(lesson.id);
      const start=screen.queryByRole('button',{name:'开始关卡'});
      if(start) fireEvent.click(start);
      const report=searchSpatialExperiment(createGame(lesson.board));
      expect(report.status).toBe('solved');
      const letters={up:'U',down:'D',left:'L',right:'R'};
      play(report.solution!.map(d=>letters[d]).join(''));
      expect(screen.getByRole('status').textContent).toContain('已完成');
      if (lesson.id === e05ReturnRoute.id) fireEvent.click(screen.getByRole('button',{name:'下一关'}));
      else expect(screen.queryByRole('button', { name: '下一关' })).toBeNull();
      expect(masteryV2Catalog.formalLevelOrder).not.toContain(lesson.id);
    }
    expect((screen.getByRole('combobox',{name:'关卡'}) as HTMLSelectElement).value).toBe(e05GoalHandoff.id);
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'lab')).toContain(e05SharedGoals.id);
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'formal')).toEqual([]);
    expect(masteryV2Catalog.formalLevelOrder).not.toContain(e05ReturnRoute.id);
  },15000);
  it('offers the three-object transfer as LAB 24 with independent progress', () => {
    saveCourseProgress(window.localStorage,masteryV2Catalog,'lab',[e04SharedCourt.id,e04SideRoute.id]);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab(e05SharedGoals.id);
    expect(screen.getByRole('heading',{name:/LAB 24 — 叠庭/})).toBeTruthy();
    const report=searchSpatialExperiment(createGame(e05SharedGoals.board),{maximumStates:200000});
    expect(report.status).toBe('solved');
    const letters={up:'U',down:'D',left:'L',right:'R'};
    play(report.solution!.map(d=>letters[d]).join(''));
    expect(screen.getByRole('status').textContent).toContain('已完成');
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'lab')).toContain(e04SharedCourt.id);
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'formal')).toEqual([]);
    expect(masteryV2Catalog.formalLevelOrder).not.toContain(e05SharedGoals.id);
  },30000);
  it('offers the new transfer after the accepted chain without changing formal progress', () => {
    render(<App initialCatalogId="mastery-v2" />);
    selectLab(e04SideRoute.id);
    expect(screen.getByRole('heading',{name:/LAB 21 — 侧隅/})).toBeTruthy();
    const report=searchSpatialExperiment(createGame(e04SideRoute.board));
    expect(report.status).toBe('solved');
    const letters={up:'U',down:'D',left:'L',right:'R'};
    play(report.solution!.map(d=>letters[d]).join(''));
    expect(screen.getByRole('status').textContent).toContain('已完成');
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'formal')).toEqual([]);
    const index=masteryV2Catalog.labLevels.findIndex(l=>l.id===e04SideRoute.id);
    expect(masteryV2Catalog.labLevels[index-1]!.id).toBe(e04SharedCourt.id);
    expect(masteryV2Catalog.formalLevelOrder).not.toContain(e04SideRoute.id);
  },15000);
  it('shows author ratings 4, 5, 7 without treating them as blind-playtest samples', () => {
    render(<App initialCatalogId="mastery-v2" />);
    for (const [id,rating] of [['lab-e04-upper-route',4],['lab-e04-middle-court',5],['lab-e04-shared-court',7],['lab-e04-side-route',2],['lab-e05-shared-goals',8]] as const) {
      selectLab(id);
      expect(within(screen.getByRole('region',{name:'作者工具'})).getByText(new RegExp(`作者 D${rating}`))).toBeTruthy();
      expect(masteryV2Catalog.labLevels.find(l=>l.id===id)!.difficulty.sampleSize).toBe(0);
    }
  },30000);
  it('orders the shared-court teaching pair before the unchanged hard board and preserves progress', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'lab', [e04SharedCourt.id]);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab(e04UpperRoute.id);
    for (const lesson of [e04UpperRoute, e04TeachingLevels[1]!]) {
      expect((screen.getByRole('combobox', {name:'关卡'}) as HTMLSelectElement).value).toBe(lesson.id);
      const start=screen.queryByRole('button', {name:'开始关卡'});
      if (start) fireEvent.click(start);
      const report=searchSpatialExperiment(createGame(lesson.board), {maximumStates:200000});
      expect(report.status).toBe('solved');
      const letters={up:'U',down:'D',left:'L',right:'R'};
      play(report.solution!.map(d=>letters[d]).join(''));
      expect(screen.getByRole('status').textContent).toContain('已完成');
      fireEvent.click(screen.getByRole('button', {name:'下一关'}));
      expect(masteryV2Catalog.formalLevelOrder).not.toContain(lesson.id);
    }
    expect((screen.getByRole('combobox', {name:'关卡'}) as HTMLSelectElement).value).toBe(e04SharedCourt.id);
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'lab')).toContain(e04SharedCourt.id);
    expect(loadCourseProgress(window.localStorage,masteryV2Catalog,'formal')).toEqual([]);
  },30000);
  it('offers the new shared-space experiment without changing existing laboratory order', () => {
    render(<App initialCatalogId="mastery-v2" />);
    selectLab(e04SharedCourt.id);
    expect(screen.getByRole('heading', { name: /LAB 20 — 合庭/ })).toBeTruthy();
    const report = searchSpatialExperiment(createGame(e04SharedCourt.board), { maximumStates: 200000 });
    expect(report.status).toBe('solved');
    const letters = { up:'U', down:'D', left:'L', right:'R' };
    play(report.solution!.map(d=>letters[d]).join(''));
    expect(screen.getByRole('status').textContent).toContain('已完成');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    expect(masteryV2Catalog.formalLevelOrder).not.toContain(e04SharedCourt.id);
  }, 30000);
  it('offers the three-object bridge as LAB 25 without renumbering the hard original or changing formal progress', () => {
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e05-shared-bridge');
    expect(screen.getByRole('heading', { name: /LAB 25 — 间庭/ })).toBeTruthy();
    const level = masteryV2Catalog.labLevels.find(level => level.id === 'lab-e05-shared-bridge')!;
    const report = searchSpatialExperiment(createGame(level.board));
    expect(report.status).toBe('solved');
    const letters = { up: 'U', down: 'D', left: 'L', right: 'R' };
    play(report.solution!.map(direction => letters[direction]).join(''));
    expect(screen.getByRole('status').textContent).toContain('已完成');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    selectLab('lab-e05-shared-goals');
    expect(screen.getByRole('heading', { name: /LAB 24 — 叠庭/ })).toBeTruthy();
  }, 30000);
  it('offers the E03 boundary after the played pair and replays it to completion', () => {
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e03-west-court');
    expect(screen.getByRole('heading', { name: /LAB 16 — 西庭/ })).toBeTruthy();
    play('UDDRRULLDLLUUURD');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    expect(masteryV2Catalog.labLevels.filter(l => l.id.startsWith('lab-e03-')).map(l => l.id))
      .toEqual(['lab-e03-alcove', 'lab-e03-side-court', 'lab-e03-west-court']);
  }, 15000);
  it('offers the E03 pair in learning order without modifying formal progress', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'formal', ['lesson-01']);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab(e03GoalSpaceLevels[0]!.id);
    expect(screen.getByRole('heading', { name: /LAB 14 — 小庭/ })).toBeTruthy();
    const report = searchSpatialExperiment(createGame(e03GoalSpaceLevels[0]!.board));
    expect(report.status).toBe('solved');
    const letters = { up: 'U', down: 'D', left: 'L', right: 'R' };
    play(report.solution!.map(d => letters[d]).join(''));
    expect(screen.getByRole('status').textContent).toContain('已完成');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe(e03GoalSpaceLevels[1]!.id);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual(['lesson-01']);
    for (const level of e03GoalSpaceLevels) {
      expect(masteryV2Catalog.formalLevelOrder).not.toContain(level.id);
      expect(acceptedFoundationCatalog.labLevels.some(l => l.id === level.id)).toBe(false);
    }
  }, 15_000);
  it('inserts two complete precursors before the unchanged return-loan transfer', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'lab', ['lab-e02-shared-bay', 'lab-e02-independent-bay']);
    render(<App initialCatalogId="mastery-v2" />);
    fireEvent.change(screen.getByRole('combobox', { name: '课程区域' }), { target: { value: 'lab' } });
    const options = within(screen.getByRole('combobox', { name: '关卡' })).getAllByRole('option') as HTMLOptionElement[];
    expect(options.filter(option => option.value.startsWith('lab-e02-')).map((option) => option.value)).toEqual([
      'lab-e02-return-door',
      'lab-e02-return-reservation',
      'lab-e02-return-loan',
      'lab-e02-shared-bay',
      'lab-e02-independent-bay',
    ]);
    selectLab('lab-e02-return-door');
    expect(screen.getAllByRole('gridcell', { name: /地面 Goal/ })).toHaveLength(3);
    expect(document.querySelector('.lesson-description')?.textContent)
      .not.toMatch(/返回|归还|先把|取回|站位|交接/);
    play('UDDRRULUULLRRDDDLLUR');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe('lab-e02-return-reservation');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab')).toEqual([
      'lab-e02-shared-bay', 'lab-e02-independent-bay', 'lab-e02-return-door',
    ]);
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual([]);
    for (const id of ['lab-e02-return-door', 'lab-e02-return-reservation', 'lab-e02-return-loan']) {
      expect(masteryV2Catalog.formalLevelOrder).not.toContain(id);
      expect(acceptedFoundationCatalog.labLevels.some((spec) => spec.id === id)).toBe(false);
    }
  }, 15_000);

  it('keeps old stable-ID completions and advances short court to bypass with author-only ratings', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'lab', ['lab-e06-interleaved']);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e06-small-court');
    expect(within(screen.getByRole('region', { name: '作者工具' })).getByText(/作者 D4/)).toBeTruthy();
    play('LLURDRULLLLDRR');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe('lab-e06-independent-return');
    expect(within(screen.getByRole('region', { name: '作者工具' })).getByText(/作者 D5/)).toBeTruthy();
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'lab'))
      .toEqual(['lab-e06-interleaved', 'lab-e06-small-court']);
  }, 15_000);

  it('makes both E02 candidates freely playable without adding formal progress or explaining the trick', () => {
    saveCourseProgress(window.localStorage, masteryV2Catalog, 'formal', ['lesson-01']);
    render(<App initialCatalogId="mastery-v2" />);
    selectLab('lab-e02-shared-bay');
    expect(screen.getAllByRole('gridcell', { name: /地面 Goal/ })).toHaveLength(4);
    expect(document.querySelector('.lesson-description')?.textContent).not.toMatch(/暂存|先把|取回|交接/);
    play('RURRDDRDDLLLUDRRRULUUULLLDRRURDLDRDDLUUU');
    expect(screen.getByRole('status').textContent).toContain('已完成');
    fireEvent.click(screen.getByRole('button', { name: '下一关' }));
    expect((screen.getByRole('combobox', { name: '关卡' }) as HTMLSelectElement).value)
      .toBe('lab-e02-independent-bay');
    expect(loadCourseProgress(window.localStorage, masteryV2Catalog, 'formal')).toEqual(['lesson-01']);
    for (const catalog of [masteryV2Catalog, acceptedFoundationCatalog]) {
      expect(catalog.levels.some((level) => level.id.startsWith('lab-e02'))).toBe(false);
      expect(catalog.formalLevelOrder.some((id) => id.startsWith('lab-e02'))).toBe(false);
    }
  }, 15_000);
});
