import { describe, expect, it } from 'vitest';

import { createGame, move } from '../engine/game-engine';
import type { Direction, GameState, LevelDefinition } from '../engine/types';
import { demoLevels } from './demo-levels';

const directions: readonly Direction[] = ['up', 'right', 'down', 'left'];
const maximumExploredStates = 50_000;
const walkthroughs: Readonly<Record<string, readonly Direction[]>> = {
  'push-01': ['right', 'right'],
  'shape-02': ['right', 'right'],
  'match-03': ['right', 'right'],
  'fake-04': ['right'],
  'spike-05': ['right'],
  'rain-06': ['right', 'right'],
  'goal-07': ['right', 'right', 'right', 'right'],
  'gate-08': ['right', 'down', 'left'],
  'gate-push-09': ['right', 'down', 'right'],
  'path-loop-10': ['down', 'up', 'right', 'right'],
  'path-pingpong-11': ['down', 'right', 'right'],
  'budget-12': ['right', 'right'],
};

type SearchResult = Readonly<{
  explored: number;
  solution?: readonly Direction[];
}>;

type SearchNode = Readonly<{
  state: GameState;
  solution: readonly Direction[];
}>;

function stateKey(state: GameState): string {
  const entityKey = (entities: readonly { id: string; position: { x: number; y: number } }[]) =>
    entities.map((entity) => `${entity.id}@${entity.position.x},${entity.position.y}`).join('|');
  const paths = state.paths.map((path) => `${path.id}@${path.currentNodeIndex},${path.direction}`).join('|');
  return [
    `${state.player.x},${state.player.y}`,
    entityKey(state.blocks),
    entityKey(state.goals),
    entityKey(state.gates),
    entityKey(state.spikes),
    paths,
    state.status,
  ].join('~');
}

function discardHistory(state: GameState): GameState {
  return { ...state, history: [] };
}

function findSolution(level: LevelDefinition): SearchResult {
  const initial = discardHistory(createGame(level));
  const queue: SearchNode[] = [{ state: initial, solution: [] }];
  const visited = new Set([stateKey(initial)]);
  let explored = 0;

  while (queue.length > 0 && explored < maximumExploredStates) {
    const node = queue.shift()!;
    explored += 1;

    for (const direction of directions) {
      const result = move(node.state, direction);
      if (!result.didMove || result.state.status === 'lost') continue;

      const solution = [...node.solution, direction];
      if (result.state.status === 'won') {
        return { explored, solution };
      }

      const next = discardHistory(result.state);
      const key = stateKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: next, solution });
      }
    }
  }

  return { explored };
}

describe('compact lesson catalogue', () => {
  for (const level of demoLevels) {
    it(`${level.id} has a winning route within the bounded state space`, () => {
      const result = findSolution(level);

      expect(result.solution, `explored ${result.explored} states`).toBeDefined();
    });

    it(`${level.id} keeps its displayed walkthrough valid`, () => {
      const walkthrough = walkthroughs[level.id];
      expect(walkthrough, 'missing walkthrough').toBeDefined();

      let state = createGame(level);
      for (const direction of walkthrough!) {
        const result = move(state, direction);
        expect(result.didMove, `${direction} should be a valid move`).toBe(true);
        state = result.state;
      }

      expect(state.status).toBe('won');
    });
  }
});
