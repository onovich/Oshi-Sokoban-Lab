import type { CourseGroupDefinition } from '../course/types';

function masteryLevelId(group: CourseGroupDefinition): string {
  const result = group.masteryLevelId ?? group.levelIds[Math.min(1, group.levelIds.length - 1)];
  if (!result) throw new Error(`Course group ${group.id} contains no levels.`);
  return result;
}

function groupAvailable(
  group: CourseGroupDefinition,
  groupsById: ReadonlyMap<string, CourseGroupDefinition>,
  completed: ReadonlySet<string>,
): boolean {
  if (!(group.requiredLevelIds ?? []).every((levelId) => completed.has(levelId))) return false;
  const completionRequired = new Set(group.completionPrerequisites ?? []);
  return group.prerequisites.every((prerequisiteId) => {
    const prerequisite = groupsById.get(prerequisiteId);
    if (!prerequisite) return false;
    return completionRequired.has(prerequisiteId)
      ? prerequisite.levelIds.every((levelId) => completed.has(levelId))
      : completed.has(masteryLevelId(prerequisite));
  });
}

export function getUnlockedCourseLevelIds(
  groups: readonly CourseGroupDefinition[],
  completedLevelIds: readonly string[],
): ReadonlySet<string> {
  const completed = new Set(completedLevelIds);
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const unlocked = new Set(completedLevelIds);

  for (const group of groups) {
    if (!groupAvailable(group, groupsById, completed)) continue;
    for (let index = 0; index < group.levelIds.length; index += 1) {
      const levelId = group.levelIds[index];
      const previous = group.levelIds[index - 1];
      if (levelId && (index === 0 || (previous && completed.has(previous)))) unlocked.add(levelId);
    }
  }

  return unlocked;
}

export function getNextSequentialLevelId(
  orderedLevelIds: readonly string[],
  currentLevelId: string,
): string | undefined {
  const currentIndex = orderedLevelIds.indexOf(currentLevelId);
  return currentIndex >= 0 ? orderedLevelIds[currentIndex + 1] : undefined;
}

export function getNextCourseLevelId(
  groups: readonly CourseGroupDefinition[],
  currentLevelId: string,
  completedLevelIds: readonly string[],
): string | undefined {
  const unlocked = getUnlockedCourseLevelIds(groups, completedLevelIds);
  const completed = new Set(completedLevelIds);
  const currentGroup = groups.find((group) => group.levelIds.includes(currentLevelId));
  const currentIndex = currentGroup?.levelIds.indexOf(currentLevelId) ?? -1;

  if (currentGroup && currentIndex >= 0 && currentIndex < currentGroup.levelIds.length - 1) {
    const nextInGroup = currentGroup.levelIds[currentIndex + 1];
    if (nextInGroup && unlocked.has(nextInGroup)) return nextInGroup;
  }

  return groups
    .flatMap((group) => [...group.levelIds])
    .find((levelId) => unlocked.has(levelId) && !completed.has(levelId));
}
