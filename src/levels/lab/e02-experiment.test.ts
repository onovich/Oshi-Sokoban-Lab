import { describe, expect, it } from 'vitest';
import { createGame, move, restart, undo } from '../../engine/game-engine';
import type { Direction, GameState, MoveResult } from '../../engine/types';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e02Contrast, e02Prototype } from './e02-experiment';
import { auditLevelMutations } from '../level-mutation-audit';

const directions: readonly Direction[] = ['up', 'right', 'down', 'left'];
const bId = `${e02Prototype.id}-b`;

/** Reach a push side using only real, non-pushing moves, then test the proposed retrieval. */
function canRetrieveUp(state: GameState, blockId: string): boolean {
  const queue = [state];
  const visited = new Set<string>();
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    const key = `${current.player.x},${current.player.y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (move(current, 'up').events.some((event) => event.type === 'block-pushed' && event.entityId === blockId)) return true;
    for (const direction of directions) {
      const result = move(current, direction);
      if (result.didMove && result.events.length === 0) queue.push({ ...result.state, history: [] });
    }
  }
  return false;
}

const noRecoverableSouthStaging = (_before: GameState, result: MoveResult) => {
  const block = result.state.blocks.find((item) => item.id === bId)!;
  return block.position.y === 3 && canRetrieveUp(result.state, bId);
};

describe('E02 recoverable staging experiment', () => {
  it('is a complete two-shape task replayable under the real spatial rules', () => {
    const initial = createGame(e02Prototype.board);
    expect(initial.status).toBe('playing');
    expect(initial.blocks).toHaveLength(2);
    expect(initial.blocks[0]!.shape).not.toEqual(initial.blocks[1]!.shape);
    const report = searchSpatialExperiment(initial, { maximumStates: 200_000 });
    expect(report.status).toBe('solved');
    let state = initial;
    for (const direction of report.solution!) {
      const result = move(state, direction);
      expect(result.didMove).toBe(true);
      state = result.state;
    }
    expect(state.status).toBe('won');
  });

  it('requires recoverable south staging, not merely visiting a named square or taking the last push', () => {
    const result = searchSpatialExperiment(createGame(e02Prototype.board), {
      maximumStates: 200_000, forbiddenTransition: noRecoverableSouthStaging,
    });
    expect(result.status).toBe('proven-unsolved');
    expect(result.forbiddenTransitions).toBeGreaterThan(0);
    expect(searchSpatialExperiment(createGame(e02Prototype.board), {
      maximumStates: 200_000, forbiddenConditions: e02Prototype.theorem.proofConditions,
    }).status).toBe('proven-unsolved');
  });

  it('decouples the same tasks through a second bay without any south-staging handoff', () => {
    expect({ ...e02Contrast.board, id: '', title: '', width: 0, walls: [] })
      .toEqual({ ...e02Prototype.board, id: '', title: '', width: 0, walls: [] });
    const result = searchSpatialExperiment(createGame(e02Contrast.board), {
      maximumStates: 200_000,
      forbiddenConditions: e02Prototype.theorem.proofConditions,
      // Stronger than the positive predicate: B never enters the shared south bay at all.
      forbiddenTransition: (_before, next) => next.state.blocks.find((b) => b.id === bId)!.position.y >= 2,
    });
    expect(result.status).toBe('solved');
    let state = createGame(e02Contrast.board);
    let usedIndependentBay = false;
    for (const direction of result.solution!) {
      state = move(state, direction).state;
      const b = state.blocks.find((item) => item.id === bId)!;
      usedIndependentBay ||= b.position.x === 3 && b.position.y === 1;
    }
    expect(usedIndependentBay).toBe(true);
    expect(state.status).toBe('won');
  });

  it('distinguishes a shallow recoverable stop from a deep, irreversible parking mistake', () => {
    const initial = createGame(e02Prototype.board);
    let shallow = initial;
    for (const direction of ['right', 'up', 'right', 'right', 'down', 'down'] as const) {
      shallow = move(shallow, direction).state;
    }
    expect(shallow.blocks.find((b) => b.id === bId)!.position).toEqual({ x: 2, y: 3 });
    expect(canRetrieveUp(shallow, bId)).toBe(true);
    expect(searchSpatialExperiment(shallow).status).toBe('solved');
    const deep = move(shallow, 'down');
    expect(deep.didMove).toBe(true);
    expect(canRetrieveUp(deep.state, bId)).toBe(false);
    expect(searchSpatialExperiment(deep.state).status).toBe('proven-unsolved');
    expect(undo(deep.state)).toEqual(shallow);
    expect(restart(deep.state)).toEqual(initial);
  });

  it('checks each object against the surviving task, not a proof that refers to a removed ID', () => {
    const withoutA = createGame({ ...e02Prototype.board, blocks: [e02Prototype.board.blocks[1]!] });
    expect(searchSpatialExperiment(withoutA, { forbiddenTransition: noRecoverableSouthStaging }).status).toBe('solved');
    const noEastTurn = (_before: GameState, result: MoveResult) => result.events.some((event) =>
      event.type === 'block-pushed' && event.entityId === `${e02Prototype.id}-a` &&
      event.from.x === 3 && event.from.y === 1 && event.to.x === 3 && event.to.y === 2);
    expect(searchSpatialExperiment(createGame(e02Prototype.board), { forbiddenTransition: noEastTurn }).status)
      .toBe('proven-unsolved');
    const withoutB = createGame({ ...e02Prototype.board, blocks: [e02Prototype.board.blocks[0]!] });
    expect(searchSpatialExperiment(withoutB, { forbiddenTransition: noEastTurn }).status).toBe('solved');
  });

  it.each([{ x: 4, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 2 }])(
    'needs each added independent-bay cell for the decoupled route (%j)', (wall) => {
      const state = createGame({ ...e02Contrast.board, walls: [...e02Contrast.board.walls, wall] });
      expect(searchSpatialExperiment(state, {
        forbiddenTransition: (_before, next) => next.state.blocks[1]!.position.y >= 2,
      }).status).toBe('proven-unsolved');
    },
  );

  it('has no unexplained empty floor or invalid mutation counted as proof', () => {
    const mutations = auditLevelMutations(e02Prototype, 200_000);
    expect(mutations).toHaveLength(17);
    expect(mutations.filter((item) => item.classification === 'redundant')).toEqual([]);
    expect(mutations.filter((item) => item.kind !== 'entity-removal')
      .every((item) => item.effect === 'unsolvable')).toBe(true);
  });
});
