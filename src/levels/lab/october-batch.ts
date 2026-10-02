import type { CourseGroupDefinition, LevelSpec } from '../../course/types';
import { octS05 } from './oct-s05';
import { octG03 } from './oct-g03';
import { octM03 } from './oct-m03';
import { octM01 } from './oct-m01';
import { octG01 } from './oct-g01';
import { octS01 } from './oct-s01';
import { octM02 } from './oct-m02';
import { octG02 } from './oct-g02';
import { octS02 } from './oct-s02';

// Append in publication order: historical LAB numbers and saved stable IDs never shift.
export const octoberBatch: readonly LevelSpec[] = [octM01, octG01, octS01, octM02, octG02, octS02, octM03, octG03, octS05];
const chapters: readonly Omit<CourseGroupDefinition, 'levelIds'>[] = [
  { id: 'oct-goal', title: '十月 · 目标工作空间', branch: 'goal', prerequisites: [] },
  { id: 'oct-gate', title: '十月 · 远端通路', branch: 'gate', prerequisites: [] },
  { id: 'oct-rain', title: '十月 · 雨中资源', branch: 'rain', prerequisites: [] },
  { id: 'oct-assignment', title: '十月 · 目标分配', branch: 'combination', prerequisites: [] },
  { id: 'oct-hazard-space', title: '十月 · 空间桥接（前期）', branch: 'shape', prerequisites: [] },
  { id: 'oct-hazard-goal', title: '十月 · 目标桥接（前期）', branch: 'goal', prerequisites: [] },
  { id: 'oct-hazard-rain', title: '十月 · 雨中桥接（前期）', branch: 'rain', prerequisites: [] },
  { id: 'oct-hazard-gate', title: '十月 · 通路桥接（前期）', branch: 'gate', prerequisites: [] },
  { id: 'oct-origin', title: '十月 · 回位调度（揭示后）', branch: 'spike', prerequisites: [] },
];
export const octoberGroups: readonly CourseGroupDefinition[] = chapters.map(chapter => ({
  ...chapter, levelIds: octoberBatch.filter(level => level.groupId === chapter.id).map(level => level.id),
})).filter(chapter => chapter.levelIds.length > 0);
