import { describe, expect, it } from 'vitest';

import { createGame, isBlockSolved, move, restart, undo } from '../../engine/game-engine';
import type { Direction } from '../../engine/types';
import { auditLevelMutations } from '../level-mutation-audit';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e06Contrast, e06Prototype } from './e06-experiment';

describe('E06 interleaved preparation experiment', () => {
  it('has a complete replay with three real tasks under the original rules', () => {
    expect(e06Prototype.board.blocks).toHaveLength(3);
    const initial = createGame(e06Prototype.board);
    const report = searchSpatialExperiment(initial, { maximumStates: 150_000 });
    expect(report.status).toBe('solved');
    let state = initial;
    for (const direction of report.solution!) state = move(state, direction).state;
    expect(state.status).toBe('won');
  });

  it('requires the three-task handoff between the long block’s two staging positions', () => {
    expect(e06Prototype.theorem.proofConditions).toHaveLength(1);
    const report = searchSpatialExperiment(createGame(e06Prototype.board), {
      maximumStates: 200_000,
      forbiddenConditions: e06Prototype.theorem.proofConditions,
    });
    expect(report.status).toBe('proven-unsolved');
    expect(report.forbiddenTransitions).toBeGreaterThan(0);
  });

  it('removes the shared dependency by opening one return square, without changing any task', () => {
    expect({ ...e06Contrast.board, id: '', title: '', description: '', walls: [] })
      .toEqual({ ...e06Prototype.board, id: '', title: '', description: '', walls: [] });
    expect(e06Prototype.board.walls.filter((wall) =>
      !e06Contrast.board.walls.some((other) => wall.x === other.x && wall.y === other.y),
    )).toEqual([{ x: 2, y: 1 }]);
    const forbiddenTransition = (before: ReturnType<typeof createGame>, result: ReturnType<typeof move>) =>
      isBlockSolved(before, before.blocks[0]!) && !isBlockSolved(result.state, result.state.blocks[0]!);
    expect(searchSpatialExperiment(createGame(e06Prototype.board), {
      maximumStates: 200_000, forbiddenTransition,
    }).status).toBe('proven-unsolved');
    const contrast = searchSpatialExperiment(createGame(e06Contrast.board), {
      maximumStates: 200_000, forbiddenTransition,
      forbiddenConditions: e06Prototype.theorem.proofConditions,
    });
    expect(contrast.status).toBe('solved');
    let state = createGame(e06Contrast.board);
    for (const direction of contrast.solution!) state = move(state, direction).state;
    expect(state.status).toBe('won');
  });

  it.each([
    ['a', 'b', 'c'], ['a', 'c', 'b'], ['b', 'a', 'c'],
    ['b', 'c', 'a'], ['c', 'a', 'b'], ['c', 'b', 'a'],
  ])('cannot complete one whole task at a time in order %s, %s, %s', (...order) => {
    const initial = createGame(e06Prototype.board);
    const orderedIds = order.map((name) => `${e06Prototype.id}-${name}`);
    const report = searchSpatialExperiment(initial, {
      forbiddenTransition: (before, result) => {
        const nextTask = orderedIds.find((id) =>
          !isBlockSolved(before, before.blocks.find((block) => block.id === id)!));
        return result.events.some((event) => event.type === 'block-pushed' && event.entityId !== nextTask);
      },
    });
    expect(report.status).toBe('proven-unsolved');
  });

  it.each<readonly Direction[]>([['right', 'down'], ['down', 'down', 'down']])(
    'makes an enticing early commitment recoverable with Undo rather than changing the rules (%j)',
    (...prefix) => {
      const initial = createGame(e06Prototype.board);
      let state = initial;
      for (const direction of prefix) {
        const result = move(state, direction);
        expect(result.didMove).toBe(true);
        state = result.state;
      }
      expect(searchSpatialExperiment(state, { maximumStates: 150_000 }).status).toBe('proven-unsolved');
      expect(searchSpatialExperiment(undo(state), { maximumStates: 150_000 }).status).toBe('solved');
      expect(restart(state)).toEqual(initial);
    },
  );

  it('checks removal against surviving tasks, not the inevitable loss of a referenced event', () => {
    const forbidLosingCoverage = (before: ReturnType<typeof createGame>, result: ReturnType<typeof move>) =>
      before.blocks.some((block) => isBlockSolved(before, block) &&
        !isBlockSolved(result.state, result.state.blocks.find((next) => next.id === block.id)!));
    const forbidUpperStaging = (_before: ReturnType<typeof createGame>, result: ReturnType<typeof move>) =>
      result.events.some((event) => event.type === 'block-pushed' &&
        event.entityId === `${e06Prototype.id}-c` && event.to.x === 3 && event.to.y === 1);
    for (const forbiddenTransition of [forbidLosingCoverage, forbidUpperStaging]) {
      expect(searchSpatialExperiment(createGame(e06Prototype.board), {
        maximumStates: 200_000, forbiddenTransition,
      }).status).toBe('proven-unsolved');
    }
    for (const removed of ['a', 'b', 'c']) {
      const initial = createGame({
        ...e06Prototype.board,
        blocks: e06Prototype.board.blocks.filter((block) => block.id !== `${e06Prototype.id}-${removed}`),
      });
      // C remains present when checking B's effect on its upper staging requirement.
      const forbiddenTransition = removed === 'b' ? forbidUpperStaging : forbidLosingCoverage;
      const report = searchSpatialExperiment(initial, { maximumStates: 200_000, forbiddenTransition });
      expect(report.status).toBe('solved');
      let state = initial;
      for (const direction of report.solution!) {
        const result = move(state, direction);
        expect(forbiddenTransition(state, result)).toBe(false);
        state = result.state;
      }
      expect(state.status).toBe('won');
    }
  });

  it('has no unexplained empty floor or invalid mutation used as proof', () => {
    const mutations = auditLevelMutations(e06Prototype, 200_000);
    expect(mutations.filter((mutation) => mutation.classification === 'redundant')).toEqual([]);
    expect(mutations).toHaveLength(19);
    for (const mutation of mutations) {
      expect(['unsolvable', 'bypass-created']).toContain(mutation.effect);
    }
  }, 30_000);
});
