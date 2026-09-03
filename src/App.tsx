import { useCallback, useEffect, useMemo, useState } from 'react';

import { Board } from './components/Board';
import { CurriculumMap } from './components/CurriculumMap';
import { GameControls } from './components/GameControls';
import { LessonBriefing } from './components/LessonBriefing';
import { createGame, move, restart, tick, undo } from './engine/game-engine';
import type { Direction, DomainEvent, GameState, GateTraversal } from './engine/types';
import { courseGroups, courseLevels } from './levels/course-catalog';
import { getNextCourseLevelId, getUnlockedCourseLevelIds } from './levels/course-progress';
import { hasObjectReset, SPIKE_RESET_TIMING } from './rendering/spike-reset-presentation';
import './styles.css';

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

function specFor(id: string) {
  return courseLevels.find((level) => level.id === id);
}

type GameView = Readonly<{
  state: GameState;
  gateTraversal?: GateTraversal;
  turnEvents?: readonly DomainEvent[];
}>;

export type LessonAccessMode = 'free' | 'progression';

type AppProps = Readonly<{
  lessonAccessMode?: LessonAccessMode;
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
}: AppProps = {}) {
  const firstSpec = courseLevels[0]!;
  const [gameView, setGameView] = useState<GameView>(() => ({ state: createGame(firstSpec.board) }));
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);
  const [completedLevelIds, setCompletedLevelIds] = useState<readonly string[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { gateTraversal, state, turnEvents } = gameView;
  const isResetPresenting = hasObjectReset(turnEvents);
  const activeSpec = specFor(state.level.id) ?? firstSpec;
  const activeGroup = courseGroups.find((group) => group.id === activeSpec.groupId)!;
  const completedSet = useMemo(() => new Set(completedLevelIds), [completedLevelIds]);
  const unlockedLevelIds = useMemo(
    () => getUnlockedCourseLevelIds(courseGroups, completedLevelIds),
    [completedLevelIds],
  );
  const selectableLevelIds = useMemo(
    () => lessonAccessMode === 'free'
      ? new Set(courseLevels.map((level) => level.id))
      : unlockedLevelIds,
    [lessonAccessMode, unlockedLevelIds],
  );
  const completedForNavigation = state.status === 'won' && !completedSet.has(activeSpec.id)
    ? [...completedLevelIds, activeSpec.id]
    : completedLevelIds;
  const nextLevelId = state.status === 'won'
    ? getNextCourseLevelId(courseGroups, activeSpec.id, completedForNavigation)
    : undefined;
  const nextSpec = nextLevelId ? specFor(nextLevelId) : undefined;

  const loadLesson = useCallback((id: string) => {
    if (!selectableLevelIds.has(id)) return;
    const level = specFor(id);
    if (!level) return;
    setGameView({ state: createGame(level.board) });
    setIsBriefingOpen(true);
  }, [selectableLevelIds]);

  const applyMove = useCallback((direction: Direction) => {
    if (isBriefingOpen) return;
    setGameView((previous) => {
      if (hasObjectReset(previous.turnEvents)) return previous;
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
    setGameView((previous) => ({ state: undo(previous.state) }));
  }, [isBriefingOpen]);

  const applyRestart = useCallback(() => {
    if (isBriefingOpen) return;
    setGameView((previous) => ({ state: restart(previous.state) }));
  }, [isBriefingOpen]);

  const advanceLesson = useCallback(() => {
    if (!nextSpec) return;
    setGameView({ state: createGame(nextSpec.board) });
    setIsBriefingOpen(true);
  }, [nextSpec]);

  useEffect(() => {
    if (state.status !== 'won') return;
    setCompletedLevelIds((previous) => previous.includes(state.level.id) ? previous : [...previous, state.level.id]);
  }, [state.level.id, state.status]);

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
  }, [applyMove, applyRestart, applyUndo, isBriefingOpen]);

  useEffect(() => {
    if (state.remainingSeconds === undefined || state.status !== 'playing') return undefined;
    const timer = window.setInterval(
      () => setGameView((previous) => ({
        state: tick(previous.state, 1),
        turnEvents: hasObjectReset(previous.turnEvents) ? previous.turnEvents : [],
      })),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state.remainingSeconds, state.status]);

  const resultMessage =
    state.status === 'won'
      ? nextSpec
        ? `已完成。点击“下一关”进入「${nextSpec.board.title}」。`
        : '已完成全部关卡。课程地图仍可重玩任意关卡。'
      : state.status === 'lost'
        ? '已触发本关限制；可用 Undo 或 Restart 返回。'
        : state.level.description;
  const moveCounter = state.level.stepLimit === undefined
    ? `步数: ${state.moves}`
    : `步数: ${state.moves} / ${state.level.stepLimit}`;

  return (
    <main className={`app-shell ${state.level.weather === 'rain' ? 'app-shell--rain' : ''}`}>
      <header className="masthead">
        <p className="eyebrow">WEB MECHANICS COURSE · NO VN</p>
        <h1>OSHI / PUSH STUDIES</h1>
        <p className="masthead__lede">{courseLevels.length} 个关卡，用稳定规则逐步建立、定界并推演 Oshi 的推箱子语言。</p>
      </header>

      <section className="lesson-strip" aria-label="Lesson selection">
        <label htmlFor="lesson-picker">关卡</label>
        <select id="lesson-picker" onChange={(event) => loadLesson(event.target.value)} value={state.level.id}>
          {courseLevels.map((level) => (
            <option disabled={!selectableLevelIds.has(level.id)} key={level.id} value={level.id}>
              {level.board.title}
            </option>
          ))}
        </select>
        <p className="lesson-strip__progress">已完成 {completedLevelIds.length} / {courseLevels.length}</p>
        <p className="lesson-strip__weather">{state.level.weather === 'rain' ? 'RAIN RULESET' : 'CLEAR RULESET'}</p>
      </section>

      <CurriculumMap
        activeLevelId={activeSpec.id}
        completedLevelIds={completedSet}
        groups={courseGroups}
        levels={courseLevels}
        onSelect={loadLesson}
        unlockedLevelIds={selectableLevelIds}
      />

      <div className="game-layout game-layout--course">
        {isBriefingOpen ? (
          <LessonBriefing
            groupTitle={activeGroup.title}
            key={state.level.id}
            onStart={() => setIsBriefingOpen(false)}
            spec={activeSpec}
          />
        ) : (
          <section aria-labelledby="lesson-title" className="play-area">
            <div className="play-area__heading">
              <div>
                <p className="eyebrow">{activeGroup.title} · {activeSpec.role.toUpperCase()}</p>
                <h2 id="lesson-title">{state.level.title}</h2>
              </div>
              <p aria-live="polite" className={`result result--${state.status}`} role="status">
                {moveCounter} · {statusLabel(state)}
                {state.remainingSeconds !== undefined ? ` · 时间: ${state.remainingSeconds}s` : ''}
              </p>
            </div>
            <p className="lesson-description">{resultMessage}</p>
            <Board gateTraversal={gateTraversal} state={state} turnEvents={turnEvents} />
            <GameControls
              movementDisabled={isResetPresenting}
              nextLessonTitle={nextSpec?.board.title}
              onMove={applyMove}
              onNext={state.status === 'won' && !isResetPresenting && nextSpec ? advanceLesson : undefined}
              onRestart={applyRestart}
              onUndo={applyUndo}
              state={state}
            />
          </section>
        )}
      </div>
    </main>
  );
}
