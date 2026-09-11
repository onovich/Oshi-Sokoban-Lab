import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { rainPreludes } from './rs02-rain-prelude';
import { laboratoryShelf, nextLibraryLevelId } from '../../course/lab-library';
import { masteryV2Catalog } from '../../course/course-catalog';

it('requires the small block handoff in both playable preludes', () => {
  for (const spec of rainPreludes) {
    const options = { maximumStates: 80000, maximumPlans: 1 };
    const report = solveLevel(spec, options);
    expect(report.status).toBe('solved');
    let state = createGame(spec.board);
    expect(state.status).toBe('playing');
    for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
    expect(state.status).toBe('won');
    for (const condition of spec.theorem.proofConditions) {
      expect(solveLevel(spec, { ...options, forbiddenConditions: [condition] }).status).toBe('proven-unsolved');
    }
  }
});

it('offers the new preludes before the unchanged original without renumbering it', () => {
  const shelves = laboratoryShelf(masteryV2Catalog.labLevels);
  expect(masteryV2Catalog.labLevels[30]!.id).toBe('lab-rs01-rain-staging');
  expect(nextLibraryLevelId(shelves, rainPreludes[0]!.id)).toBe('lab-rs06-crossing-bank');
  expect(nextLibraryLevelId(shelves, 'lab-rs06-crossing-bank')).toBe(rainPreludes[1]!.id);
  expect(nextLibraryLevelId(shelves, rainPreludes[1]!.id)).toBe('lab-rs01-rain-staging');
});
