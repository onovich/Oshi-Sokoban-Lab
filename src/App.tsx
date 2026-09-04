import { useCallback, useEffect, useMemo, useState } from 'react';

import { Board } from './components/Board';
import { AuthorAnalysisPanel } from './components/AuthorAnalysisPanel';
import { CurriculumMap } from './components/CurriculumMap';
import { DifficultySummary } from './components/DifficultySummary';
import { GameControls } from './components/GameControls';
import { LessonBriefing } from './components/LessonBriefing';
import { SolutionDemo } from './components/SolutionDemo';
import {
  acceptedFoundationCatalog,
  displayNumberFor,
  masteryV2Catalog,
} from './course/course-catalog';
import { summarizeCourseCompletion } from './course/course-completion';
import {
  loadCourseProgress,
  saveCourseProgress,
} from './course/course-progress-store';
import type {
  CourseCatalog,
  CourseCatalogId,
  LevelSpec,
} from './course/types';
import { createGame, move, restart, tick, undo } from './engine/game-engine';
import type { Direction, DomainEvent, GameState, GateTraversal } from './engine/types';
import { getNextCourseLevelId, getUnlockedCourseLevelIds } from './levels/course-progress';
import { hasObjectReset, SPIKE_RESET_TIMING } from './rendering/spike-reset-presentation';
import { requestSolution, type SolutionLoader } from './solver/solution-request';
import './styles.css';

const catalogs: readonly CourseCatalog[] = [acceptedFoundationCatalog, masteryV2Catalog];

const keyDirections: Readonly<Record<string, Direction | undefined>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

function statusLabel(state: GameState): string {
  if (state.status === 'won') return '已完成';
  if (state.status === 'lost') return '失败';
  return '进行中';
}

function catalogFor(id: CourseCatalogId): CourseCatalog {
  const catalog = catalogs.find((candidate) => candidate.id === id);
  if (!catalog) throw new Error(`Unknown course catalog ${id}.`);
  return catalog;
}

function stripLegacyNumber(title: string): string {
  return title.replace(/^\d+\s+—\s+/, '');
}

type CourseScope = 'formal' | 'lab';

function displayTitle(catalog: CourseCatalog, scope: CourseScope, spec: LevelSpec): string {
  const levels = scope === 'formal' ? catalog.levels : catalog.labLevels;
  const index = levels.findIndex((level) => level.id === spec.id);
  const formalNumber = displayNumberFor(catalog, spec.id);
  const prefix = scope === 'formal' && formalNumber !== undefined
    ? String(formalNumber).padStart(2, '0')
    : `LAB ${String(index + 1).padStart(2, '0')}`;
  return `${prefix} — ${stripLegacyNumber(spec.board.title)}`;
}

type GameView = Readonly<{
  state: GameState;
  demonstrating?: boolean;
  gateTraversal?: GateTraversal;
  turnEvents?: readonly DomainEvent[];
}>;

export type LessonAccessMode = 'free' | 'progression';

type AppProps = Readonly<{
  lessonAccessMode?: LessonAccessMode;
  authoringMode?: boolean;
  initialCatalogId?: CourseCatalogId;
  progressStorage?: Storage;
  solutionLoader?: SolutionLoader;
}>;

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia(reducedMotionQuery).matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(reducedMotionQuery);
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function App({
  lessonAccessMode = import.meta.env.DEV ? 'free' : 'progression',
  authoringMode = import.meta.env.DEV,
  initialCatalogId = 'accepted-foundation-v1',
  progressStorage,
  solutionLoader = requestSolution,
}: AppProps = {}) {
  const storage = progressStorage ?? window.localStorage;
  const [selection, setSelection] = useState<Readonly<{
    catalogId: CourseCatalogId;
    scope: CourseScope;
  }>>({ catalogId: initialCatalogId, scope: 'formal' });
  const catalog = catalogFor(selection.catalogId);
  const levels = selection.scope === 'formal' ? catalog.levels : catalog.labLevels;
  const groups = selection.scope === 'formal' ? catalog.groups : catalog.labGroups;
  const acts = selection.scope === 'formal'
    ? catalog.acts
    : [{ id: 'lab', title: '开发实验室', levelIds: catalog.labLevels.map((level) => level.id) }];
  const firstSpec = levels[0];
  if (!firstSpec) throw new Error(`${catalog.id}/${selection.scope} contains no playable levels.`);

  const [gameView, setGameView] = useState<GameView>(() => ({ state: createGame(firstSpec.board) }));
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);
  const [completedLevelIds, setCompletedLevelIds] = useState<readonly string[]>(() =>
    loadCourseProgress(storage, catalog, selection.scope));
  const prefersReducedMotion = usePrefersReducedMotion();
  const { gateTraversal, state, turnEvents } = gameView;
  const isDemonstrating = gameView.demonstrating === true;
  const isResetPresenting = hasObjectReset(turnEvents);
  const specFor = useCallback(
    (id: string) => levels.find((level) => level.id === id),
    [levels],
  );
  const activeSpec = specFor(state.level.id) ?? firstSpec;
  const activeGroup = groups.find((group) => group.id === activeSpec.groupId) ?? groups[0];
  if (!activeGroup) throw new Error(`Missing group for ${activeSpec.id}.`);
  const activeTitle = displayTitle(catalog, selection.scope, activeSpec);
  const completedSet = useMemo(() => new Set(completedLevelIds), [completedLevelIds]);
  const completion = useMemo(
    () => summarizeCourseCompletion(catalog, completedLevelIds),
    [catalog, completedLevelIds],
  );
  const unlockedLevelIds = useMemo(
    () => selection.scope === 'lab'
      ? new Set(levels.map((level) => level.id))
      : getUnlockedCourseLevelIds(groups, completedLevelIds),
    [completedLevelIds, groups, levels, selection.scope],
  );
  const selectableLevelIds = useMemo(
    () => lessonAccessMode === 'free' || selection.scope === 'lab'
      ? new Set(levels.map((level) => level.id))
      : unlockedLevelIds,
    [lessonAccessMode, levels, selection.scope, unlockedLevelIds],
  );
  const displayNumbers = useMemo(
    () => new Map(levels.map((level, index) => [
      level.id,
      selection.scope === 'formal'
        ? displayNumberFor(catalog, level.id) ?? index + 1
        : index + 1,
    ])),
    [catalog, levels, selection.scope],
  );
  const completedForNavigation = state.status === 'won' && !completedSet.has(activeSpec.id)
    ? [...completedLevelIds, activeSpec.id]
    : completedLevelIds;
  const nextLevelId = state.status === 'won'
    ? getNextCourseLevelId(groups, activeSpec.id, completedForNavigation)
    : undefined;
  const nextSpec = nextLevelId ? specFor(nextLevelId) : undefined;

  const activateCourseArea = useCallback((catalogId: CourseCatalogId, scope: CourseScope) => {
    if (scope === 'lab' && !authoringMode) return;
    const nextCatalog = catalogFor(catalogId);
    const nextLevels = scope === 'formal' ? nextCatalog.levels : nextCatalog.labLevels;
    const nextFirst = nextLevels[0];
    if (!nextFirst) return;
    setSelection({ catalogId, scope });
    setCompletedLevelIds(loadCourseProgress(storage, nextCatalog, scope));
    setGameView({ state: createGame(nextFirst.board) });
    setIsBriefingOpen(true);
  }, [authoringMode, storage]);

  const loadLesson = useCallback((id: string) => {
    if (!selectableLevelIds.has(id)) return;
    const level = specFor(id);
    if (!level) return;
    setGameView({ state: createGame(level.board) });
    setIsBriefingOpen(true);
  }, [selectableLevelIds, specFor]);

  const applyMove = useCallback((direction: Direction) => {
    if (isBriefingOpen) return;
    setGameView((previous) => {
      if (previous.demonstrating || hasObjectReset(previous.turnEvents)) return previous;
      const result = move(previous.state, direction);
      return {
        state: result.state,
        gateTraversal: result.gateTraversal,
        turnEvents: result.events,
      };
    });
  }, [isBriefingOpen]);

  const applyUndo = useCallback(() => {
    if (isBriefingOpen) return;
    setGameView((previous) => previous.demonstrating ? previous : { state: undo(previous.state) });
  }, [isBriefingOpen]);

  const applyRestart = useCallback(() => {
    if (isBriefingOpen) return;
    setGameView((previous) => previous.demonstrating ? previous : { state: restart(previous.state) });
  }, [isBriefingOpen]);

  const advanceLesson = useCallback(() => {
    if (!nextSpec) return;
    setGameView({ state: createGame(nextSpec.board) });
    setIsBriefingOpen(true);
  }, [nextSpec]);

  function exitSolutionDemo() {
    setGameView((previous) => ({ state: previous.state }));
    requestAnimationFrame(() => document.getElementById('solution-demo-trigger')?.focus());
  }

  useEffect(() => {
    if (state.status !== 'won') return;
    setCompletedLevelIds((previous) => previous.includes(activeSpec.id)
      ? previous
      : [...previous, activeSpec.id]);
  }, [activeSpec.id, state.status]);

  useEffect(() => {
    saveCourseProgress(storage, catalog, selection.scope, completedLevelIds);
  }, [catalog, completedLevelIds, selection.scope, storage]);

  useEffect(() => {
    if (!hasObjectReset(turnEvents)) return undefined;
    const presentedEvents = turnEvents;
    const duration = prefersReducedMotion
      ? SPIKE_RESET_TIMING.reducedMotionTotalMs
      : SPIKE_RESET_TIMING.totalMs;
    const timer = window.setTimeout(() => {
      setGameView((previous) => previous.turnEvents === presentedEvents
        ? { ...previous, turnEvents: [] }
        : previous);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, turnEvents]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.matches('select, input, textarea')) return;
      if (isBriefingOpen) return;

      if (isDemonstrating) {
        if (event.key === 'Escape') {
          event.preventDefault();
          exitSolutionDemo();
        } else if (keyDirections[event.key.toLowerCase()] || keyDirections[event.key]
          || ['z', 'r'].includes(event.key.toLowerCase())) {
          event.preventDefault();
        }
        return;
      }

      const direction = keyDirections[event.key.toLowerCase()] ?? keyDirections[event.key];
      if (direction) {
        event.preventDefault();
        applyMove(direction);
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        applyUndo();
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        applyRestart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyMove, applyRestart, applyUndo, exitSolutionDemo, isBriefingOpen, isDemonstrating]);

  useEffect(() => {
    if (isDemonstrating || state.remainingSeconds === undefined || state.status !== 'playing') return undefined;
    const timer = window.setInterval(
      () => setGameView((previous) => ({
        state: tick(previous.state, 1),
        turnEvents: hasObjectReset(previous.turnEvents) ? previous.turnEvents : [],
      })),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state.remainingSeconds, state.status, isDemonstrating]);

  const resultMessage = state.status === 'won'
    ? nextSpec
      ? `已完成。点击“下一关”进入「${displayTitle(catalog, selection.scope, nextSpec)}」。`
      : '已完成当前区域全部关卡。课程地图仍可重玩任意关卡。'
    : state.status === 'lost'
      ? '已触发本关限制；可用 Undo 或 Restart 返回。'
      : state.level.description;
  const moveCounter = state.level.stepLimit === undefined
    ? `步数: ${state.moves}`
    : `步数: ${state.moves} / ${state.level.stepLimit}`;
  const progressLabel = selection.scope === 'lab' ? '实验室进度' : '已完成';
  const layeredProgress = catalog.id === 'mastery-v2' && selection.scope === 'formal'
    ? `基础结业 ${completion.foundation.completed}/${completion.foundation.required} · ` +
      `主线结局 ${completion.mainEnding.completed}/${completion.mainEnding.required} · ` +
      `100% ${completion.full.completed}/${completion.full.required}`
    : undefined;

  return (
    <main className={`app-shell ${state.level.weather === 'rain' ? 'app-shell--rain' : ''}`}>
      <header className="masthead">
        <p className="eyebrow">WEB MECHANICS COURSE · NO VN</p>
        <h1>OSHI / PUSH STUDIES</h1>
        <p className="masthead__lede">
          {catalog.title} · 当前 {levels.length} 关 / 目标 {catalog.targetFormalLevelCount} 关。
        </p>
      </header>

      {authoringMode ? (
        <>
        <section aria-label="作者工具" className="author-tools">
          <label htmlFor="catalog-picker">课程目录</label>
          <select
            id="catalog-picker"
            onChange={(event) => activateCourseArea(event.target.value as CourseCatalogId, selection.scope)}
            value={catalog.id}
          >
            {catalogs.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
            ))}
          </select>
          <label htmlFor="course-scope-picker">课程区域</label>
          <select
            id="course-scope-picker"
            onChange={(event) => activateCourseArea(catalog.id, event.target.value as CourseScope)}
            value={selection.scope}
          >
            <option value="formal">正式课程</option>
            <option value="lab">开发实验室</option>
          </select>
          <DifficultySummary difficulty={activeSpec.difficulty} />
        </section>
        <AuthorAnalysisPanel key={`${catalog.id}:${selection.scope}:${activeSpec.id}`} spec={activeSpec} />
        </>
      ) : null}

      <section className="lesson-strip" aria-label="Lesson selection">
        <label htmlFor="lesson-picker">关卡</label>
        <select id="lesson-picker" onChange={(event) => loadLesson(event.target.value)} value={activeSpec.id}>
          {levels.map((level) => (
            <option disabled={!selectableLevelIds.has(level.id)} key={level.id} value={level.id}>
              {displayTitle(catalog, selection.scope, level)}
            </option>
          ))}
        </select>
        <p className="lesson-strip__progress">{progressLabel} {completedLevelIds.length} / {levels.length}</p>
        {layeredProgress ? <p className="lesson-strip__completion">{layeredProgress}</p> : null}
        <p className="lesson-strip__weather">{state.level.weather === 'rain' ? 'RAIN RULESET' : 'CLEAR RULESET'}</p>
      </section>

      <CurriculumMap
        activeLevelId={activeSpec.id}
        acts={acts}
        completedLevelIds={completedSet}
        displayNumbers={displayNumbers}
        groups={groups}
        levels={levels}
        onSelect={loadLesson}
        unlockedLevelIds={selectableLevelIds}
      />

      <div className="game-layout game-layout--course">
        {isBriefingOpen ? (
          <LessonBriefing
            displayTitle={activeTitle}
            groupTitle={activeGroup.title}
            key={`${catalog.id}:${selection.scope}:${activeSpec.id}`}
            onStart={() => setIsBriefingOpen(false)}
            spec={activeSpec}
          />
        ) : (
          <section aria-labelledby="lesson-title" className="play-area">
            <div className="play-area__heading">
              <div>
                <p className="eyebrow">{activeGroup.title} · {activeSpec.role.toUpperCase()}</p>
                <h2 id="lesson-title">{activeTitle}</h2>
              </div>
              {!isDemonstrating ? (
                <p aria-live="polite" className={`result result--${state.status}`} role="status">
                  {moveCounter} · {statusLabel(state)}
                  {state.remainingSeconds !== undefined ? ` · 时间: ${state.remainingSeconds}s` : ''}
                </p>
              ) : null}
            </div>
            {isDemonstrating ? (
              <SolutionDemo
                key={`${catalog.id}:${selection.scope}:${activeSpec.id}`}
                loadSolution={solutionLoader}
                onExit={exitSolutionDemo}
                reducedMotion={prefersReducedMotion}
                spec={activeSpec}
              />
            ) : (
              <>
                <p className="lesson-description">{resultMessage}</p>
                <Board gateTraversal={gateTraversal} state={state} turnEvents={turnEvents} />
                <GameControls
                  movementDisabled={isResetPresenting}
                  nextLessonTitle={nextSpec ? displayTitle(catalog, selection.scope, nextSpec) : undefined}
                  onMove={applyMove}
                  onDemonstrate={() => setGameView((previous) => ({ ...previous, demonstrating: true }))}
                  onNext={state.status === 'won' && !isResetPresenting && nextSpec ? advanceLesson : undefined}
                  onRestart={applyRestart}
                  onUndo={applyUndo}
                  state={state}
                />
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
