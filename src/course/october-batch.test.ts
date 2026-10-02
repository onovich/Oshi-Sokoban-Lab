import { expect, it } from 'vitest';
import { octoberBatch, octoberGroups } from '../levels/lab/october-batch';
import { masteryV2Catalog, acceptedFoundationCatalog } from './course-catalog';
import { laboratoryShelf } from './lab-library';
import { createGame } from '../engine/game-engine';

it('adds only implemented October candidates without moving historical lab numbers or formal slots', () => {
  expect(octoberBatch).toHaveLength(30);
  expect(new Set(octoberBatch.map(level => level.board.title)).size).toBe(30);
  const knownIds = new Set([...masteryV2Catalog.levels, ...masteryV2Catalog.labLevels].map(level => level.id));
  expect(masteryV2Catalog.labLevels.slice(53)).toEqual(octoberBatch);
  expect(masteryV2Catalog.labLevels[52]!.id).toBe('lab-h2-clearance');
  expect(new Set(octoberBatch.map(level => level.id)).size).toBe(octoberBatch.length);
  for (const level of octoberBatch) {
    for (const prerequisite of level.prerequisites) expect(knownIds.has(prerequisite), prerequisite).toBe(true);
    expect(createGame(level.board).status).toBe('playing');
    expect(level.board.paths).toEqual([]);
    expect(level.board.stepLimit).toBeUndefined();
    expect(level.board.timeLimitSeconds).toBeUndefined();
    expect(level.theorem.proofConditions.length).toBeGreaterThan(0);
    expect(masteryV2Catalog.formalLevelOrder).not.toContain(level.id);
    expect(acceptedFoundationCatalog.labLevels.map(l => l.id)).not.toContain(level.id);
  }
});
it('offers chapter progression without renumbering publication IDs', () => {
  expect(octoberGroups.find(g => g.id === 'oct-origin')!.levelIds).toEqual(
    ['s07', 's06', 's09', 's10', 's05', 's08'].map(id => `lab-oct-${id}`));
  expect(octoberGroups.find(g => g.id === 'oct-rain')!.levelIds).toEqual(
    ['m04', 'm10', 'm05'].map(id => `lab-oct-${id}`));
});

it('keeps the new chapter shelves complete without chaining early hazards to reset revelation', () => {
  const shelves = laboratoryShelf(masteryV2Catalog.labLevels);
  for (const group of octoberGroups) {
    expect(shelves.find(shelf => shelf.id === group.id)?.levelIds).toEqual(group.levelIds);
    expect(masteryV2Catalog.labGroups).toContainEqual(group);
    if (group.id.startsWith('oct-hazard-')) expect(group.levelIds).toHaveLength(1);
  }
  expect(octoberGroups.flatMap(group => group.levelIds).sort())
    .toEqual(octoberBatch.map(level => level.id).sort());
});
