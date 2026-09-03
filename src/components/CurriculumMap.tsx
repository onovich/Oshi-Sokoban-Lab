import type {
  CourseActDefinition,
  CourseGroupDefinition,
  LevelSpec,
  TeachingRole,
} from '../course/types';

const roleLabels: Readonly<Record<TeachingRole, string>> = {
  establish: '建立关',
  boundary: '定界关',
  inference: '推演关',
  practice: '练习关',
  transfer: '迁移关',
  synthesis: '综合关',
  summit: '峰顶关',
};

type CurriculumMapProps = Readonly<{
  activeLevelId: string;
  acts: readonly CourseActDefinition[];
  completedLevelIds: ReadonlySet<string>;
  displayNumbers: ReadonlyMap<string, number>;
  groups: readonly CourseGroupDefinition[];
  levels: readonly LevelSpec[];
  onSelect: (levelId: string) => void;
  unlockedLevelIds: ReadonlySet<string>;
}>;

export function CurriculumMap({
  activeLevelId,
  acts,
  completedLevelIds,
  displayNumbers,
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
      <div className="curriculum-map__acts">
        {acts.map((act) => {
          const order = new Map(act.levelIds.map((id, index) => [id, index]));
          const actGroups = groups
            .filter((group) => group.levelIds.some((id) => order.has(id)))
            .sort((left, right) => {
              const leftIndex = Math.min(...left.levelIds.map((id) => order.get(id) ?? Number.MAX_SAFE_INTEGER));
              const rightIndex = Math.min(...right.levelIds.map((id) => order.get(id) ?? Number.MAX_SAFE_INTEGER));
              return leftIndex - rightIndex;
            });
          return (
            <section className="curriculum-act" key={act.id}>
              <header className="curriculum-act__heading">
                <h3>{act.title}</h3>
                <span>{act.levelIds.length === 0 ? '待制作' : `${act.levelIds.length} 关`}</span>
              </header>
              {actGroups.length === 0 ? (
                <p className="curriculum-act__empty">峰顶席位将在候选关通过证明与盲测后开放。</p>
              ) : (
                <div className="curriculum-map__groups">
                  {actGroups.map((group) => {
                    const masteryLevelId =
                      group.masteryLevelId ?? group.levelIds[Math.min(1, group.levelIds.length - 1)];
                    const mastered = masteryLevelId ? completedLevelIds.has(masteryLevelId) : false;
                    const complete = group.levelIds.every((id) => completedLevelIds.has(id));
                    return (
                      <article
                        className={`curriculum-group${mastered ? ' curriculum-group--mastered' : ''}${complete ? ' curriculum-group--complete' : ''}`}
                        data-branch={group.branch}
                        key={group.id}
                      >
                        <header>
                          <span>{group.id.slice(0, 3).toUpperCase()}</span>
                          <h4>{group.title}</h4>
                        </header>
                        <div className="curriculum-group__lessons">
                          {group.levelIds.map((levelId) => {
                            const level = levelsById.get(levelId);
                            if (!level || !order.has(levelId)) return null;
                            const number = String(displayNumbers.get(levelId) ?? '?').padStart(2, '0');
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
              )}
            </section>
          );
        })}
      </div>
    </details>
  );
}
