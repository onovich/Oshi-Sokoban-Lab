import { describe, expect, it } from 'vitest';
import { createGame, move, restart, undo } from '../../engine/game-engine';
import type { Direction, GameState, LevelDefinition, MoveResult } from '../../engine/types';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e02ReturnLoan } from './e02-return-loan';
import { auditLevelMutations } from '../level-mutation-audit';
import { analyzeLevelForAuthor } from '../../solver/author-analysis';

const directions: readonly Direction[] = ['up', 'right', 'down', 'left'];
const keys: Readonly<Record<string, Direction>> = { U: 'up', R: 'right', D: 'down', L: 'left' };
const id = (name: string) => `${e02ReturnLoan.id}-${name}`;
const at = (state: GameState, name: string, x: number, y: number) => {
  const position = state.blocks.find((block) => block.id === id(name))!.position;
  return position.x === x && position.y === y;
};

function play(board: LevelDefinition, route: string): GameState {
  let state = createGame(board);
  for (const key of route) {
    const result = move(state, keys[key]!);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  return state;
}

/** Observe reachable push sides using only real, non-pushing movement. */
function walkingStates(state: GameState): readonly GameState[] {
  const queue = [{ ...state, history: [] }];
  const seen = new Set([`${state.player.x},${state.player.y}`]);
  for (let index = 0; index < queue.length; index += 1) {
    for (const direction of directions) {
      const result = move(queue[index]!, direction);
      const key = `${result.state.player.x},${result.state.player.y}`;
      if (!result.didMove || result.events.length > 0 || seen.has(key)) continue;
      seen.add(key);
      queue.push({ ...result.state, history: [] });
    }
  }
  return queue;
}

function canPush(state: GameState, name: string, direction: Direction): boolean {
  return walkingStates(state).some((reachable) => move(reachable, direction).events.some((event) =>
    event.type === 'block-pushed' && event.entityId === id(name)));
}

const noReservedReturn = (_before: GameState, result: MoveResult) => {
  const state = result.state;
  const c = state.blocks.find((block) => block.id === id('c'))!;
  return at(state, 'a', 2, 1) && at(state, 'b', 2, 3) && c.position.y === 0 && c.position.x < 2 &&
    canPush(state, 'a', 'right') && walkingStates(state).some((s) => s.player.x === 1 && s.player.y === 4);
};

const borrowedTooEarly = 'UDLDDRRRULRULUULLDR';
const returnCells = [2, 3, 4].map((y) => ({ x: 0, y }));
const contrastBoard: LevelDefinition = {
  ...e02ReturnLoan.board,
  walls: e02ReturnLoan.board.walls.filter((wall) => wall.x !== 0 || wall.y === 1),
};
// Strong contrast: new cells are walking-only, and B cannot reverse its early left move.
const noNewBoxRoute = (_before: GameState, result: MoveResult) =>
  result.state.blocks.some((block) => block.position.x === 0 && block.position.y >= 1) ||
  result.state.blocks.find((block) => block.id === id('b'))!.position.x !== 1;

describe('E02 repeated space loan experiment', () => {
  it('has a complete, replayable solution under the unchanged spatial rules', () => {
    const initial = createGame(e02ReturnLoan.board);
    expect(initial.status).toBe('playing');
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

  it('requires a reserved return route while A is borrowed, beyond counting pushes', () => {
    const report = searchSpatialExperiment(createGame(e02ReturnLoan.board), {
      maximumStates: 200_000, forbiddenTransition: noReservedReturn,
    });
    expect(report.status).toBe('proven-unsolved');
    expect(report.forbiddenTransitions).toBeGreaterThan(0);
    for (const condition of e02ReturnLoan.theorem.proofConditions) {
      expect(searchSpatialExperiment(createGame(e02ReturnLoan.board), {
        maximumStates: 200_000, forbiddenConditions: [condition],
      }).status).toBe('proven-unsolved');
    }
  });

  it('allows the tempting early subtask but loses B retrieval despite an empty destination', () => {
    const prepared = play(e02ReturnLoan.board, 'UDLDDRRRU');
    expect(searchSpatialExperiment(prepared).status).toBe('solved');
    const early = move(prepared, 'left');
    expect(early.events.some((event) => event.type === 'block-pushed' && event.entityId === id('b'))).toBe(true);
    expect(searchSpatialExperiment(early.state).status).toBe('proven-unsolved');
    expect(undo(early.state)).toEqual(prepared);

    const afterSubtask = play(e02ReturnLoan.board, borrowedTooEarly);
    expect(at(afterSubtask, 'c', 0, 0)).toBe(true);
    expect(at(afterSubtask, 'a', 3, 1)).toBe(true);
    expect(at(afterSubtask, 'b', 1, 3)).toBe(true);
    for (const x of [1, 2]) {
      expect(afterSubtask.blocks.some((block) => block.shape.some((part) =>
        part.x + block.position.x === x && part.y + block.position.y === 2))).toBe(false);
      expect(afterSubtask.level.walls.some((wall) => wall.x === x && wall.y === 2)).toBe(false);
    }
    expect(canPush(afterSubtask, 'b', 'up')).toBe(false);
    expect(searchSpatialExperiment(afterSubtask).status).toBe('proven-unsolved');
    expect(restart(afterSubtask)).toEqual(createGame(e02ReturnLoan.board));
  });

  it('rescues the same early choice with only a player return route and unchanged final assignments', () => {
    expect({ ...contrastBoard, walls: [] }).toEqual({ ...e02ReturnLoan.board, walls: [] });
    expect(e02ReturnLoan.board.walls.filter((wall) => !contrastBoard.walls.includes(wall))).toEqual(returnCells);
    const state = play(contrastBoard, borrowedTooEarly);
    expect(canPush(state, 'b', 'up')).toBe(true);
    const report = searchSpatialExperiment(state, { maximumStates: 200_000, forbiddenTransition: noNewBoxRoute });
    expect(report.status).toBe('solved');
    let current = state;
    for (const direction of report.solution!) {
      const result = move(current, direction);
      expect(noNewBoxRoute(current, result)).toBe(false);
      current = result.state;
    }
    expect(current.status).toBe('won');
    expect(current.blocks.map((block) => block.position)).toEqual([{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 0 }]);
  });

  it.each(returnCells)('needs return cell %j when the contrast is constrained to walking', (wall) => {
    const state = play({ ...contrastBoard, walls: [...contrastBoard.walls, wall] }, borrowedTooEarly);
    expect(searchSpatialExperiment(state, { maximumStates: 200_000, forbiddenTransition: noNewBoxRoute }).status)
      .toBe('proven-unsolved');
  });

  it('tests each removed object against an existing surviving task', () => {
    const noAReturn = (_before: GameState, result: MoveResult) => result.events.some((event) =>
      event.type === 'block-pushed' && event.entityId === id('a') &&
      event.from.x === 2 && event.from.y === 1 && event.to.x === 3 && event.to.y === 1);
    // With A present, preparing B before relocating C is a dead end.
    const early = play(e02ReturnLoan.board, 'LDDRRRUL');
    expect(searchSpatialExperiment(early).status).toBe('proven-unsolved');
    const withoutA = { ...e02ReturnLoan.board, blocks: e02ReturnLoan.board.blocks.filter((b) => b.id !== id('a')) };
    expect(searchSpatialExperiment(play(withoutA, 'LDDRRRUL')).status).toBe('solved');
    for (const removed of ['b', 'c']) {
      const initial = createGame({
        ...e02ReturnLoan.board, blocks: e02ReturnLoan.board.blocks.filter((b) => b.id !== id(removed)),
      });
      expect(searchSpatialExperiment(initial, { forbiddenTransition: noAReturn }).status).toBe('solved');
    }
    expect(searchSpatialExperiment(createGame(e02ReturnLoan.board), { forbiddenTransition: noAReturn }).status)
      .toBe('proven-unsolved');
  });

  it('starts with every goal visible and no unexplained floor in the mutation audit', () => {
    for (const goal of e02ReturnLoan.board.terrainGoals) {
      expect(e02ReturnLoan.board.blocks.some((block) => block.shape.some((part) =>
        block.position.x + part.x === goal.x && block.position.y + part.y === goal.y))).toBe(false);
      expect(e02ReturnLoan.board.player).not.toEqual(goal);
    }
    const mutations = auditLevelMutations(e02ReturnLoan, 200_000);
    expect(mutations).toHaveLength(16);
    expect(mutations.filter((item) => item.classification === 'redundant' || item.effect === 'invalid' || item.effect === 'inconclusive')).toEqual([]);
    expect(mutations.filter((item) => item.kind !== 'entity-removal').every((item) => item.effect === 'unsolvable')).toBe(true);
    const report = analyzeLevelForAuthor(e02ReturnLoan, { maximumStates: 200_000, maximumPlans: 8, pushSlack: 2, moveSlack: 8 });
    expect(report.solution.status).toBe('solved');
    expect(report.proofChecks.every((check) => check.status === 'necessary')).toBe(true);
    expect(report.solution.proof.insightTailPushes).toBeLessThanOrEqual(6);
  }, 30_000);
});
