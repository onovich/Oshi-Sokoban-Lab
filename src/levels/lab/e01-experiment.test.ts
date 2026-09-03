import { describe, expect, it } from 'vitest';

import { createGame, isBlockSolved, move, restart, undo } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { analyzeLevelForAuthor } from '../../solver/author-analysis';
import type { Direction, GameState, MoveResult } from '../../engine/types';
import { auditLevelMutations } from '../level-mutation-audit';
import { e01Contrast, e01Prototype } from './e01-experiment';
import { searchSpatialExperiment } from './spatial-experiment-search';

function readjustsAWhileBIsUnfinished(before: GameState, result: MoveResult): boolean {
  const a = before.blocks[0]!;
  const b = before.blocks[1]!;
  const aHasOpened = a.position.x !== a.origin.x || a.position.y !== a.origin.y;
  // B can also be returned to its initial square after the player crosses.
  // That is an equivalent staging strategy, not a forbidden special case.
  return aHasOpened && !isBlockSolved(before, b) &&
    result.events.some((event) => event.type === 'block-pushed' && event.entityId === a.id);
}

describe('E01 · shared passage experiment', () => {
  it('has a complete playable solution using the unchanged move rules', () => {
    const report = solveLevel(e01Prototype, { maximumStates: 50_000 });
    expect(report.status).toBe('solved');
    expect(report.bestPlan).toBeDefined();

    let state = createGame(e01Prototype.board);
    expect(state.blocks.every((block) => isBlockSolved(state, block))).toBe(false);
    for (const direction of report.bestPlan!.directions) {
      const result = move(state, direction);
      expect(result.didMove).toBe(true);
      state = result.state;
    }
    expect(state.status).toBe('won');
    expect(state.blocks.every((block) => isBlockSolved(state, block))).toBe(true);
  });

  it('cannot avoid readjusting A while B is still unfinished, regardless of its staging square', () => {
    const report = searchSpatialExperiment(createGame(e01Prototype.board), {
      forbiddenTransition: readjustsAWhileBIsUnfinished,
    });

    expect(report.status, JSON.stringify(report)).toBe('proven-unsolved');
    expect(report.forbiddenTransitions).toBeGreaterThan(0);
  });

  it('allows B to finish before A readjusts when only the independent passage is opened', () => {
    expect(e01Prototype.board.walls.filter((wall) =>
      !e01Contrast.board.walls.some((other) => wall.x === other.x && wall.y === other.y),
    )).toEqual([{ x: 3, y: 2 }]);
    expect(e01Contrast.board.blocks).toEqual(e01Prototype.board.blocks);
    expect(e01Contrast.board.terrainGoals).toEqual(e01Prototype.board.terrainGoals);
    expect(e01Contrast.board.player).toEqual(e01Prototype.board.player);

    const report = searchSpatialExperiment(createGame(e01Contrast.board), {
      forbiddenTransition: readjustsAWhileBIsUnfinished,
    });
    expect(report.status, JSON.stringify(report)).toBe('solved');
    let state = createGame(e01Contrast.board);
    for (const direction of report.solution!) state = move(state, direction).state;
    expect(state.status).toBe('won');
  });

  it('reports the deferred completion ordering as necessary only in the prototype', () => {
    expect(analyzeLevelForAuthor(e01Prototype).proofChecks.map((check) => check.status))
      .toEqual(['necessary']);
    expect(analyzeLevelForAuthor(e01Contrast).proofChecks.map((check) => check.status))
      .toEqual(['bypass']);
  });

  it('makes the tempting early finish fail but lets Undo and Restart recover immediately', () => {
    const initial = createGame(e01Prototype.board);
    let state = initial;
    const prematureFinish: readonly Direction[] = ['up', 'up', 'right', 'up', 'right', 'right'];
    for (const direction of prematureFinish) state = move(state, direction).state;
    expect(isBlockSolved(state, state.blocks[1]!)).toBe(true);
    expect(isBlockSolved(state, state.blocks[0]!)).toBe(false);
    // The search may undo B's completion by pushing; only the Undo command is excluded.
    expect(searchSpatialExperiment(state).status).toBe('proven-unsolved');
    expect(searchSpatialExperiment(undo(state)).status).toBe('solved');
    expect(restart(state)).toEqual(initial);
  });

  it('has no invalid, budget-exhausted, or unexplained unchanged deletion mutations', () => {
    const mutations = auditLevelMutations(e01Prototype, 50_000);
    expect(mutations).toHaveLength(15);
    expect(mutations.filter((result) => result.kind === 'entity-removal')).toHaveLength(2);
    expect(mutations.filter((result) => result.kind === 'mechanism-removal')).toHaveLength(3);
    expect(mutations.filter((result) => result.kind === 'wall-insertion')).toHaveLength(10);
    for (const result of mutations) {
      expect(['unsolvable', 'bypass-created']).toContain(result.effect);
      expect(result.classification).toBe('proof-critical');
    }
  });

  it('keeps all initial Goals visible, with no object or player covering them', () => {
    const board = e01Prototype.board;
    const occupied = [board.player, ...board.blocks.flatMap((block) =>
      block.shape.map((part) => ({ x: block.position.x + part.x, y: block.position.y + part.y })),
    )];
    for (const goal of board.terrainGoals) {
      expect(occupied).not.toContainEqual(goal);
    }
  });
});
