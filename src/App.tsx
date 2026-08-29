import { useCallback, useEffect, useState } from 'react';

import { Board } from './components/Board';
import { GameControls } from './components/GameControls';
import { LessonBriefing } from './components/LessonBriefing';
import { RulesPanel } from './components/RulesPanel';
import { createGame, move, restart, tick, undo } from './engine/game-engine';
import type { Direction, GameState, GateTraversal } from './engine/types';
import { demoLevels } from './levels/demo-levels';
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

function lessonIndexFor(state: GameState): number {
  return Math.max(0, demoLevels.findIndex((level) => level.id === state.level.id));
}

type GameView = Readonly<{
  state: GameState;
  gateTraversal?: GateTraversal;
}>;

export function App() {
  const [gameView, setGameView] = useState<GameView>(() => ({ state: createGame(demoLevels[0]!) }));
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);
  const { gateTraversal, state } = gameView;
  const activeLessonIndex = lessonIndexFor(state);
  const nextLesson = demoLevels[activeLessonIndex + 1];

  const loadLesson = useCallback((id: string) => {
    const level = demoLevels.find((candidate) => candidate.id === id);
    if (!level) return;
    setGameView({ state: createGame(level) });
    setIsBriefingOpen(true);
  }, []);

  const applyMove = useCallback((direction: Direction) => {
    if (isBriefingOpen) return;
    setGameView((previous) => {
      const result = move(previous.state, direction);
      return { state: result.state, gateTraversal: result.gateTraversal };
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
    if (!nextLesson) return;
    setGameView({ state: createGame(nextLesson) });
    setIsBriefingOpen(true);
  }, [nextLesson]);

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
      () => setGameView((previous) => ({ state: tick(previous.state, 1) })),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state.remainingSeconds, state.status]);

  const resultMessage =
    state.status === 'won'
      ? nextLesson
        ? `已完成。准备好后，点击“下一关”进入「${nextLesson.title}」。`
        : '已完成全部关卡。你可以从关卡选择器重玩任意一个机制。'
      : state.status === 'lost'
        ? '角色触刺或耗尽限制；可用 Undo 或 Restart 回到可控状态。'
        : state.level.description;
  const moveCounter = state.level.stepLimit === undefined ? `步数: ${state.moves}` : `步数: ${state.moves} / ${state.level.stepLimit}`;

  return (
    <main className={`app-shell ${state.level.weather === 'rain' ? 'app-shell--rain' : ''}`}>
      <header className="masthead">
        <p className="eyebrow">WEB MECHANICS DEMO · NO VN</p>
        <h1>OSHI / PUSH STUDIES</h1>
        <p className="masthead__lede">离散回合、整块占格与可预测状态变化的推箱子实验。</p>
      </header>

      <section className="lesson-strip" aria-label="Lesson selection">
        <label htmlFor="lesson-picker">Lesson</label>
        <select id="lesson-picker" onChange={(event) => loadLesson(event.target.value)} value={state.level.id}>
          {demoLevels.map((level) => (
            <option key={level.id} value={level.id}>{level.title}</option>
          ))}
        </select>
        <p className="lesson-strip__progress">进度 {activeLessonIndex + 1} / {demoLevels.length}</p>
        <p className="lesson-strip__weather">{state.level.weather === 'rain' ? 'RAIN RULESET' : 'CLEAR RULESET'}</p>
      </section>

      <div className="game-layout">
        {isBriefingOpen ? (
          <LessonBriefing key={state.level.id} level={state.level} onStart={() => setIsBriefingOpen(false)} />
        ) : (
          <>
            <section aria-labelledby="lesson-title" className="play-area">
              <div className="play-area__heading">
                <div>
                  <p className="eyebrow">CURRENT LESSON</p>
                  <h2 id="lesson-title">{state.level.title}</h2>
                </div>
                <p aria-live="polite" className={`result result--${state.status}`} role="status">
                  {moveCounter} · {statusLabel(state)}
                  {state.remainingSeconds !== undefined ? ` · 时间: ${state.remainingSeconds}s` : ''}
                </p>
              </div>
              <p className="lesson-description">{resultMessage}</p>
              <Board gateTraversal={gateTraversal} state={state} />
              <GameControls
                nextLessonTitle={nextLesson?.title}
                onMove={applyMove}
                onNext={state.status === 'won' ? advanceLesson : undefined}
                onRestart={applyRestart}
                onUndo={applyUndo}
                state={state}
              />
            </section>
            <RulesPanel hint={state.level.hint} mechanics={state.level.mechanics ?? []} objective={state.level.objective} />
          </>
        )}
      </div>
    </main>
  );
}
