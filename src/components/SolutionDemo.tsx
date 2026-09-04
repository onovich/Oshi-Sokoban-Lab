import { useEffect, useMemo, useRef, useState } from 'react';

import type { LevelSpec } from '../course/types';
import { createGame } from '../engine/game-engine';
import type { Direction } from '../engine/types';
import { buildSolutionReplay, solutionFrameDuration, type SolutionFrame } from '../rendering/solution-replay';
import type { SolutionLoader } from '../solver/solution-request';
import { Board } from './Board';
import './solution-demo.css';

type SolutionDemoProps = Readonly<{
  spec: LevelSpec;
  loadSolution: SolutionLoader;
  onExit: () => void;
  reducedMotion: boolean;
}>;

type Session =
  | Readonly<{ status: 'ready'; frames: readonly SolutionFrame[] }>
  | Readonly<{ status: 'loading' | 'proven-unsolved' | 'budget-exhausted' | 'error' }>;

const messages = {
  loading: '正在求解…可以随时返回，游戏界面不会被搜索阻塞。',
  'proven-unsolved': '已搜索完当前规则下的状态，未找到从起点通关的路线。请反馈此关以便核查。',
  'budget-exhausted': '本次求解达到预算上限，暂未找到路线；这不代表关卡无解。',
  error: '暂时无法生成可回放的解法。可重试，或返回继续尝试。',
};

const directionLabels: Readonly<Record<Direction, string>> = {
  up: '↑ 上', down: '↓ 下', left: '← 左', right: '→ 右',
};

export function SolutionDemo({ spec, loadSolution, onExit, reducedMotion }: SolutionDemoProps) {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const initialState = useMemo(() => createGame(spec.board), [spec]);

  useEffect(() => {
    heading.current?.focus();
    const controller = new AbortController();
    void (async () => {
      try {
        const solution = await loadSolution(spec, controller.signal);
        if (controller.signal.aborted) return;
        setSession(solution.status === 'solved'
          ? { status: 'ready', frames: buildSolutionReplay(spec.board, solution.directions) }
          : { status: solution.status });
      } catch {
        if (!controller.signal.aborted) setSession({ status: 'error' });
      }
    })();
    return () => controller.abort();
  }, [attempt, loadSolution, spec]);

  return (
    <section aria-labelledby="solution-demo-title" className="solution-demo">
      <header className="solution-demo__heading">
        <h3 id="solution-demo-title" ref={heading} tabIndex={-1}>解法演示</h3>
        <button onClick={onExit} type="button">返回我的局面</button>
      </header>
      <p className="solution-demo__notice">从关卡起点演示；你的局面已保留，演示不会计入通关进度。按 Esc 也可返回。</p>
      {session.status === 'ready' ? (
        <SolutionPlayback frames={session.frames} reducedMotion={reducedMotion} />
      ) : <>
        <p className="solution-demo__status" role="status">{messages[session.status]}</p>
        {session.status !== 'loading' ? (
          <button onClick={() => { setSession({ status: 'loading' }); setAttempt((value) => value + 1); }} type="button">
            重新求解
          </button>
        ) : null}
        <Board state={initialState} />
      </>}
    </section>
  );
}

function SolutionPlayback({ frames, reducedMotion }: Readonly<{
  frames: readonly SolutionFrame[];
  reducedMotion: boolean;
}>) {
  const [index, setIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [replayId, setReplayId] = useState(0);
  const frame = frames[index]!;
  const total = frames.length - 1;
  const presenting = index !== settledIndex;
  const complete = index === total && !presenting;

  useEffect(() => {
    if (!presenting) return undefined;
    const timer = window.setTimeout(() => setSettledIndex(index), solutionFrameDuration(frame, reducedMotion));
    return () => window.clearTimeout(timer);
  }, [frame, index, presenting, reducedMotion]);

  useEffect(() => {
    if (!playing || presenting || index >= total) return undefined;
    // Leave a reading interval between fully finished animations, including the initial board.
    const timer = window.setTimeout(() => setIndex((value) => value + 1), 600);
    return () => window.clearTimeout(timer);
  }, [index, playing, presenting, total, replayId]);

  return <>
    <div className="solution-demo__transport">
      <p className="solution-demo__status" role="status" aria-atomic="true">
        {index} / {total} 步 · {complete ? '演示完毕' : playing ? '播放中' : '已暂停'}
        {frame.direction ? ` · 本步 ${directionLabels[frame.direction]}` : ''}
      </p>
      <div aria-label="演示控制" className="solution-demo__actions">
        <button disabled={complete} onClick={() => setPlaying((value) => !value)} type="button">
          {playing && !complete ? '暂停演示' : '继续演示'}
        </button>
        <button disabled={presenting || index === total} onClick={() => {
          setPlaying(false);
          setIndex((value) => value + 1);
        }} type="button">单步</button>
        <button onClick={() => {
          setIndex(0);
          setSettledIndex(0);
          setPlaying(true);
          setReplayId((value) => value + 1);
        }} type="button">重播</button>
      </div>
    </div>
    <Board
      gateTraversal={reducedMotion ? undefined : frame.gateTraversal}
      key={replayId}
      state={frame.state}
      turnEvents={presenting ? frame.events : []}
    />
  </>;
}
