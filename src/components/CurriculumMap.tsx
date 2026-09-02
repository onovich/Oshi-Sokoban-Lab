import type { CourseGroupDefinition, LessonRole, LevelSpec } from '../engine/types';

const roleLabels: Readonly<Record<LessonRole, string>> = {
  establish: '建立关',
  boundary: '定界关',
  inference: '推演关',
};

type CurriculumMapProps = Readonly<{
  activeLevelId: string;
  completedLevelIds: ReadonlySet<string>;
  groups: readonly CourseGroupDefinition[];
  levels: readonly LevelSpec[];
  onSelect: (levelId: string) => void;
  unlockedLevelIds: ReadonlySet<string>;
}>;

export function CurriculumMap({
  activeLevelId,
  completedLevelIds,
  groups,
  levels,
  onSelect,
  unlockedLevelIds,
}: CurriculumMapProps) {
  const levelsById = new Map(levels.map((level) => [level.id, level]));

  return (
    <details aria-label="课程地图" className="curriculum-map" role="region">
      <summary className="curriculum-map__heading">
        <div>
          <p className="eyebrow">COURSE MAP</p>
          <h2>机制课程</h2>
        </div>
        <span className="curriculum-map__count">{groups.length} 组 · {levels.length} 关 · 展开</span>
        <span className="curriculum-map__collapse">收起课程图</span>
      </summary>
      <div className="curriculum-map__groups">
        {groups.map((group) => {
          const mastered = completedLevelIds.has(group.levelIds[1]);
          const complete = group.levelIds.every((id) => completedLevelIds.has(id));
          return (
            <article
              className={`curriculum-group${mastered ? ' curriculum-group--mastered' : ''}${complete ? ' curriculum-group--complete' : ''}`}
              data-branch={group.branch}
              key={group.id}
            >
              <header>
                <span>{group.id.slice(0, 3).toUpperCase()}</span>
                <h3>{group.title}</h3>
              </header>
              <div className="curriculum-group__lessons">
                {group.levelIds.map((levelId) => {
                  const level = levelsById.get(levelId);
                  if (!level) return null;
                  const number = levelId.slice(-2);
                  const unlocked = unlockedLevelIds.has(levelId);
                  const completed = completedLevelIds.has(levelId);
                  return (
                    <button
                      aria-current={levelId === activeLevelId ? 'step' : undefined}
                      className={`curriculum-lesson${completed ? ' curriculum-lesson--complete' : ''}`}
                      disabled={!unlocked}
                      key={levelId}
                      onClick={() => onSelect(levelId)}
                      type="button"
                    >
                      {number} {roleLabels[level.role]}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </details>
  );
}
