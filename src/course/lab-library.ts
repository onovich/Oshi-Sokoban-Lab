import type { LevelSpec } from './types';

export type LaboratoryShelf = Readonly<{
  id: string;
  title: string;
  levelIds: readonly string[];
}>;

// Curation changes navigation, never the source catalogue or historical LAB numbers.
const shelves: readonly LaboratoryShelf[] = [
  { id: 'learning-e06', title: '保留教学链 A · D4 → D5 → D6', levelIds: [
    'lab-e06-small-court', 'lab-e06-independent-return', 'lab-e06-interleaved',
  ] },
  { id: 'learning-e02', title: '保留教学链 B · D4 → D5 → D6', levelIds: [
    'lab-e02-return-door', 'lab-e02-return-reservation', 'lab-e02-return-loan',
  ] },
  { id: 'learning-e04', title: '保留教学链 C · D4 → D5 → D7', levelIds: [
    'lab-e04-upper-route', 'lab-e04-middle-court', 'lab-e04-shared-court',
  ] },
  { id: 'contrast', title: '保留对照题 · D6 → D7', levelIds: [
    'lab-e05-lower-landing', 'lab-e05-upper-landing',
  ] },
  { id: 'challenge', title: '保留挑战 · 可暂时离开，不要求连续攻克', levelIds: [
    'lab-e05-shared-bridge', 'lab-e05-shared-goals',
  ] },
  { id: 'support', title: '补充练习 · 教学作用待复核', levelIds: [
    'lab-e02-shared-bay', 'lab-e02-independent-bay', 'lab-e03-alcove',
    'lab-e03-side-court', 'lab-e04-small-court',
  ] },
  { id: 'goal-candidate', title: 'Goal 空间协调 · 转岸 → 涉岸', levelIds: [
    'lab-gc03-goal-handoff',
    'lab-gc01-goal-return',
  ] },
  { id: 'goal-rain', title: '新候选 · Goal × Rain（待试玩）', levelIds: [
    'lab-gr01-rain-landing',
  ] },
  { id: 'rain-staging', title: '新候选 · Rain 空间协调（待试玩）', levelIds: [
    'lab-rs01-rain-staging',
  ] },
  { id: 'archive', title: '历史实验 · 不推荐为挑战前置，仍可重玩', levelIds: [
    'lab-spike-clear', 'lab-spike-rebirth', 'lab-spike-progress',
    'lab-e01-shared-passage', 'lab-e01-independent-passage', 'lab-e03-west-court',
    'lab-e04-side-route', 'lab-e05-return-route', 'lab-e05-goal-handoff',
  ] },
];

/** Unknown candidates remain visible for development instead of disappearing. */
export function laboratoryShelf(levels: readonly LevelSpec[]): readonly LaboratoryShelf[] {
  const available = new Set(levels.map(level => level.id));
  const result = shelves.map(shelf => ({
    ...shelf, levelIds: shelf.levelIds.filter(id => available.has(id)),
  })).filter(shelf => shelf.levelIds.length > 0);
  const known = new Set(result.flatMap(shelf => shelf.levelIds));
  const pending = levels.filter(level => !known.has(level.id)).map(level => level.id);
  return pending.length ? [...result, { id: 'pending', title: '新候选 · 待整理', levelIds: pending }] : result;
}

export function nextLibraryLevelId(library: readonly LaboratoryShelf[], currentId: string): string | undefined {
  const shelf = library.find(candidate => candidate.levelIds.includes(currentId));
  if (!shelf) return undefined;
  return shelf.levelIds[shelf.levelIds.indexOf(currentId) + 1];
}
