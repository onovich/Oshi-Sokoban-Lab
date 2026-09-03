import type { CourseCatalog } from './types';

export type CourseProgressScope = 'formal' | 'lab';

type StoredCourseProgress = Readonly<{
  schemaVersion: 1;
  catalogId: string;
  scope: CourseProgressScope;
  completedLevelIds: readonly string[];
}>;

const progressSchemaVersion = 1;

function storageKey(catalog: CourseCatalog, scope: CourseProgressScope): string {
  return `oshi:course-progress:${catalog.id}:${scope}`;
}

function allowedIds(catalog: CourseCatalog, scope: CourseProgressScope): ReadonlySet<string> {
  const levels = scope === 'formal' ? catalog.levels : catalog.labLevels;
  return new Set(levels.map((level) => level.id));
}

function isStoredProgress(value: unknown): value is StoredCourseProgress {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredCourseProgress>;
  return candidate.schemaVersion === progressSchemaVersion &&
    typeof candidate.catalogId === 'string' &&
    (candidate.scope === 'formal' || candidate.scope === 'lab') &&
    Array.isArray(candidate.completedLevelIds) &&
    candidate.completedLevelIds.every((id) => typeof id === 'string');
}

function validCompletedIds(
  catalog: CourseCatalog,
  scope: CourseProgressScope,
  completedLevelIds: readonly string[],
): readonly string[] {
  const allowed = allowedIds(catalog, scope);
  return [...new Set(completedLevelIds.filter((id) => allowed.has(id)))];
}

export function loadCourseProgress(
  storage: Storage,
  catalog: CourseCatalog,
  scope: CourseProgressScope,
): readonly string[] {
  try {
    const serialized = storage.getItem(storageKey(catalog, scope));
    if (!serialized) return [];
    const parsed: unknown = JSON.parse(serialized);
    if (!isStoredProgress(parsed) || parsed.catalogId !== catalog.id || parsed.scope !== scope) return [];
    return validCompletedIds(catalog, scope, parsed.completedLevelIds);
  } catch {
    return [];
  }
}

export function saveCourseProgress(
  storage: Storage,
  catalog: CourseCatalog,
  scope: CourseProgressScope,
  completedLevelIds: readonly string[],
): void {
  const value: StoredCourseProgress = {
    schemaVersion: progressSchemaVersion,
    catalogId: catalog.id,
    scope,
    completedLevelIds: validCompletedIds(catalog, scope, completedLevelIds),
  };
  storage.setItem(storageKey(catalog, scope), JSON.stringify(value));
}

