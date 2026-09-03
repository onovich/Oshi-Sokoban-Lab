import { describe, expect, it } from 'vitest';

import { createGame, isBlockSolved } from '../engine/game-engine';
import type { LevelDefinition } from '../engine/types';
import { proofConditionKey } from '../course/proof-condition';
import { courseGroups, courseLevels } from './course-catalog';
import { analyzeLevel } from './level-analyzer';
import { auditLevelMutations, auditProofCriticalElements } from './level-mutation-audit';

type BoardRequirement = (board: LevelDefinition) => boolean;

const requirements: Readonly<Record<string, BoardRequirement>> = {
  'g01-push-side': (board) => board.blocks.length > 0,
  'g02-footprint-clearance': (board) => board.blocks.some((block) => block.shape.length > 1),
  'g03-full-coverage': (board) => board.blocks.some((block) => block.shape.length > 1) && board.terrainGoals.length > 1,
  'g04-number-match': (board) => board.blocks.some((block) => block.number > 0) && board.goals.some((goal) => goal.number > 0),
  'g05-goal-allocation': (board) => board.blocks.filter((block) => !block.isFake).length > 1,
  'g06-fake-block': (board) => board.blocks.some((block) => block.isFake),
  'g07-spike-rebirth': (board) => board.terrainSpikes.length + board.spikes.length > 0,
  'g08-spike-origin': (board) => board.terrainSpikes.length + board.spikes.length > 0,
  'g09-spike-side': (board) => board.terrainSpikes.length + board.spikes.length > 0,
  'g10-movable-goal': (board) => board.goals.some((goal) => goal.movable),
  'g11-goal-mode': (board) => board.goals.some((goal) => goal.movable),
  'g12-rain-stop': (board) => board.weather === 'rain',
  'g13-rain-adjacency': (board) => board.weather === 'rain' && board.blocks.length > 0,
  'g14-gate-direction': (board) => board.gates.length >= 2,
  'g15-gate-remote': (board) => board.gates.length >= 2,
  'g16-gate-topology': (board) => board.gates.length >= 2,
  'g17-footprint-spike': (board) => board.blocks.some((block) => block.shape.length > 1) && board.terrainSpikes.length > 0,
  'g18-goal-rain': (board) => board.weather === 'rain' && board.goals.some((goal) => goal.movable),
  'g19-rain-gate': (board) => board.weather === 'rain' && board.gates.length >= 2,
  'g20-number-fake': (board) => board.blocks.some((block) => block.isFake && block.number > 0),
  'g21-gate-spike': (board) => board.gates.length >= 2 && board.terrainSpikes.length > 0,
};

describe('authored sixty-three-level course', () => {
  it('uses the promised mechanism in every lesson of each group', () => {
    for (const group of courseGroups) {
      const requirement = requirements[group.id];
      expect(requirement, `${group.id} needs a structural requirement`).toBeDefined();
      for (const level of courseLevels.filter((candidate) => candidate.groupId === group.id)) {
        expect(requirement!(level.board), `${level.id} does not contain ${group.title}`).toBe(true);
      }
    }
  });

  it('starts as a real unfinished puzzle and excludes Path Spike from every main-route lesson', () => {
    for (const level of courseLevels) {
      const state = createGame(level.board);
      const realBlocks = state.blocks.filter((block) => !block.isFake);
      expect(realBlocks, `${level.id} needs a real Block`).not.toHaveLength(0);
      expect(realBlocks.some((block) => !isBlockSolved(state, block)), `${level.id} starts solved`).toBe(true);
      expect(level.board.paths, `${level.id} must not use Path Spike`).toEqual([]);
      expect(level.board.hint, `${level.id} must not expose a hint`).toBeUndefined();
    }
  });

  it('names the single causal contrast in every boundary lesson', () => {
    for (const level of courseLevels) {
      if (level.role === 'boundary') {
        expect(level.theorem.contrastVariable, `${level.id} needs a concrete contrast`).toMatch(/；/);
      } else {
        expect(level.theorem.contrastVariable, `${level.id} must not claim a boundary contrast`).toBeUndefined();
      }
    }
  });

  it('proves every lesson solvable with an unavoidable critical event and a short post-insight tail', () => {
    for (const level of courseLevels) {
      const result = analyzeLevel(level, 100_000);
      expect(result.analysis.solvable, `${level.id} explored ${result.exploredStates} states`).toBe(true);
      for (const condition of level.theorem.proofConditions) {
        const predicateResult = analyzeLevel({
          ...level,
          theorem: { ...level.theorem, proofConditions: [condition] },
        }, 100_000);
        expect(predicateResult.analysis.bypassExists, `${level.id} can bypass ${proofConditionKey(condition)}`).toBe(false);
      }
      if (level.role === 'establish') {
        expect(result.analysis.insightTailPushes, `${level.id} has too much post-insight work`).toBeLessThanOrEqual(3);
      }
      if (level.role === 'inference') {
        expect(result.analysis.insightTailPushes, `${level.id} has too much post-insight work`).toBeLessThanOrEqual(6);
      }
    }
  }, 120_000);

  it('re-solves after deleting every predicate-named entity and proves each deletion matters', () => {
    for (const level of courseLevels) {
      const mutations = auditProofCriticalElements(level, 100_000);
      expect(mutations.length, `${level.id} has no named proof element`).toBeGreaterThan(0);
      for (const mutation of mutations) {
        expect(
          mutation.proofCritical,
          `${level.id} does not need ${mutation.target} (${mutation.effect})`,
        ).toBe(true);
      }
    }
  }, 120_000);

  it('classifies every removable mechanism and empty walkable cell without redundant space', () => {
    for (const level of courseLevels) {
      const mutations = auditLevelMutations(level, 100_000);
      const redundant = mutations.filter((mutation) => mutation.classification === 'redundant');
      expect(
        redundant,
        `${level.id} contains unclassified redundant elements`,
      ).toEqual([]);
    }
  }, 120_000);

  it('gives every inference lesson a composite consequence and a distinct, deeper board', () => {
    const boardFingerprint = (level: (typeof courseLevels)[number]) => {
      const { id: _id, title: _title, description: _description, objective: _objective, ...board } = level.board;
      return JSON.stringify(board).replaceAll(/lesson-\d+-/g, 'lesson-xx-');
    };

    for (const group of courseGroups) {
      const lessons = group.levelIds.map((id) => courseLevels.find((level) => level.id === id)!);
      const [establish, _boundary, inference] = lessons;
      const establishAnalysis = analyzeLevel(establish, 100_000).analysis;
      const inferenceAnalysis = analyzeLevel(inference, 100_000).analysis;

      expect(
        inference.theorem.proofConditions.some((condition) =>
          condition.kind === 'count' || condition.kind === 'sequence',
        ),
        `${inference.id} only checks a first-order event`,
      ).toBe(true);
      expect(
        boardFingerprint(inference),
        `${inference.id} duplicates its establish board`,
      ).not.toBe(boardFingerprint(establish));
      expect(
        inferenceAnalysis.optimalMoves > establishAnalysis.optimalMoves ||
          inferenceAnalysis.optimalPushes > establishAnalysis.optimalPushes,
        `${inference.id} is no deeper than ${establish.id}`,
      ).toBe(true);
    }
  }, 120_000);
});
