import type { LevelSpec, TeachingRole } from '../course/types';

const roleLabels: Readonly<Record<TeachingRole, string>> = {
  establish: '建立关',
  boundary: '定界关',
  inference: '推演关',
  practice: '练习关',
  transfer: '迁移关',
  synthesis: '综合关',
  summit: '峰顶关',
};

type LessonBriefingProps = Readonly<{
  displayTitle?: string;
  groupTitle: string;
  onStart: () => void;
  spec: LevelSpec;
}>;

export function LessonBriefing({ displayTitle, groupTitle, onStart, spec }: LessonBriefingProps) {
  const { board } = spec;
  return (
    <section aria-label="关卡说明" className="lesson-briefing">
      <p className="eyebrow">BEFORE YOU PLAY</p>
      <h2>{displayTitle ?? board.title}</h2>
      <p className="lesson-briefing__rule">{board.description}</p>
      <p className="lesson-briefing__curriculum">
        <span>关卡组：{groupTitle}</span>
        <span>阶段：{roleLabels[spec.role]}</span>
      </p>

      <div className="lesson-briefing__details">
        <section aria-labelledby="lesson-briefing-objective">
          <h3 id="lesson-briefing-objective">胜利目标</h3>
          <p>{board.objective ?? '让所有真实 Block 完整覆盖匹配 Goal。'}</p>
        </section>
        <section aria-labelledby="lesson-briefing-controls">
          <h3 id="lesson-briefing-controls">操作</h3>
          <p>方向键 / WASD 移动；Z 撤销；R 重开。</p>
        </section>
      </div>

      <button autoFocus className="lesson-briefing__start" onClick={onStart} type="button">
        开始关卡
      </button>
      <p className="lesson-briefing__input">规则不会在关卡中改变；从盘面和操作结果判断它们。</p>
    </section>
  );
}
