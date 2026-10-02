import type { CourseGroupDefinition, LevelSpec } from '../../course/types';
import { octG10 } from './oct-g10';
import { octG09 } from './oct-g09';
import { octG08 } from './oct-g08';
import { octM10 } from './oct-m10';
import { octG07 } from './oct-g07';
import { octS10 } from './oct-s10';
import { octS06 } from './oct-s06';
import { octM09 } from './oct-m09';
import { octS09 } from './oct-s09';
import { octM08 } from './oct-m08';
import { octS08 } from './oct-s08';
import { octM07 } from './oct-m07';
import { octS07 } from './oct-s07';
import { octM06 } from './oct-m06';
import { octG05 } from './oct-g05';
import { octS04 } from './oct-s04';
import { octM05 } from './oct-m05';
import { octG06 } from './oct-g06';
import { octS03 } from './oct-s03';
import { octG04 } from './oct-g04';
import { octM04 } from './oct-m04';
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
export const octoberBatch: readonly LevelSpec[] = [octM01, octG01, octS01, octM02, octG02, octS02, octM03, octG03, octS05, octM04, octG04, octS03, octG06, octM05, octS04, octG05, octM06, octS07, octM07, octS08, octM08, octS09, octM09, octS06, octS10, octG07, octM10, octG08, octG09, octG10];
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
// Proposed learning order, distinct from stable LAB publication numbers; author calibration is pending.
const chapterOrder: Readonly<Record<string, readonly string[]>> = {
  'oct-gate': ['g02', 'g01', 'g03', 'g05', 'g04', 'g06', 'g07', 'g08', 'g09', 'g10'],
  'oct-rain': ['m04', 'm10', 'm05'],
  'oct-origin': ['s07', 's06', 's09', 's10', 's05', 's08'],
};
export const octoberGroups: readonly CourseGroupDefinition[] = chapters.map(chapter => ({
  ...chapter, levelIds: octoberBatch.filter(level => level.groupId === chapter.id)
    .sort((a, b) => (chapterOrder[chapter.id]?.indexOf(a.id.replace('lab-oct-', '')) ?? 0)
      - (chapterOrder[chapter.id]?.indexOf(b.id.replace('lab-oct-', '')) ?? 0)).map(level => level.id),
})).filter(chapter => chapter.levelIds.length > 0);
