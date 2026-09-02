import type { CourseGroupDefinition } from '../engine/types';

function masteryLevelId(group: CourseGroupDefinition): string {
  return group.levelIds[1];
}

function groupAvailable(
  group: CourseGroupDefinition,
  groupsById: ReadonlyMap<string, CourseGroupDefinition>,
  completed: ReadonlySet<string>,
): boolean {
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
    const [establish, boundary, inference] = group.levelIds;
    unlocked.add(establish);
    if (completed.has(establish)) unlocked.add(boundary);
    if (completed.has(boundary)) unlocked.add(inference);
  }

  return unlocked;
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
