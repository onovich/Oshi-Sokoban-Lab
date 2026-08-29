import type { LevelDefinition } from '../engine/types';

type LessonBriefingProps = Readonly<{
  level: LevelDefinition;
  onStart: () => void;
}>;

export function LessonBriefing({ level, onStart }: LessonBriefingProps) {
  return (
    <section aria-label="关卡说明" className="lesson-briefing">
      <p className="eyebrow">BEFORE YOU PLAY</p>
      <h2>{level.title}</h2>
      <p className="lesson-briefing__rule">{level.description ?? '先理解这一关新增的规则，再开始解题。'}</p>

      <div className="lesson-briefing__details">
        <section aria-labelledby="lesson-briefing-mechanics">
          <h3 id="lesson-briefing-mechanics">本关机制</h3>
          <ul className="mechanic-list">
            {(level.mechanics ?? []).map((mechanic) => <li key={mechanic}>{mechanic}</li>)}
          </ul>
        </section>
        <section aria-labelledby="lesson-briefing-objective">
          <h3 id="lesson-briefing-objective">胜利目标</h3>
          <p>{level.objective ?? '让所有真实 Block 完整覆盖匹配 Goal。'}</p>
        </section>
      </div>

      <button autoFocus className="lesson-briefing__start" onClick={onStart} type="button">
        开始关卡
      </button>
      <p className="lesson-briefing__input">进入后可使用方向键或 WASD；Z 撤销，R 重开。卡关时再查看规则面板中的提示。</p>
    </section>
  );
}
