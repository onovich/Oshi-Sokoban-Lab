import { advanceProof, proofSatisfied } from '../../course/proof-evaluator';
import type { ProofCondition, SearchStatus } from '../../course/types';
import { move } from '../../engine/game-engine';
import type { Direction, GameState, MoveResult } from '../../engine/types';

type SpatialSearchOptions = Readonly<{
  maximumStates?: number;
  /** A pure, state-local constraint; history-dependent conditions need their own product state. */
  forbiddenTransition?: (before: GameState, result: MoveResult) => boolean;
  /** Event conditions begin at this snapshot; prefix progress participates in state identity. */
  forbiddenConditions?: readonly ProofCondition[];
}>;

export type SpatialSearchResult = Readonly<{
  status: SearchStatus;
  solution?: readonly Direction[];
  /** Pushes on this witness, not a claim of globally minimal push count. */
  pushes?: number;
  exploredStates: number;
  discoveredStates: number;
  forbiddenTransitions: number;
}>;

const directions: readonly Direction[] = ['up', 'right', 'down', 'left'];

function stateKey(state: GameState, progress: readonly number[]): string {
  return `${state.status}|` + [state.player, ...state.blocks.map((block) => block.position)]
    .map((position) => `${position.x},${position.y}`).join('|') + `|${progress.join(',')}`;
}

/**
 * Small experimental oracle, deliberately without deadlock/heuristic pruning.
 * It explores actual move() results, not a second implementation of pushing.
 * Plain spatial boards have no turn-dependent state; history is only for Undo.
 */
export function searchSpatialExperiment(
  initial: GameState,
  options: SpatialSearchOptions = {},
): SpatialSearchResult {
  const level = initial.level;
  if (
    level.weather !== 'clear' || initial.goals.length > 0 || initial.gates.length > 0 ||
    initial.spikes.length > 0 || initial.paths.length > 0 || level.terrainSpikes.length > 0 ||
    (level.dynamicWalls?.length ?? 0) > 0 || level.stepLimit !== undefined ||
    level.timeLimitSeconds !== undefined ||
    initial.blocks.some((block) => block.isFake || block.number !== 0)
  ) {
    throw new Error('This oracle only supports plain spatial experiments.');
  }
  const maximumStates = options.maximumStates ?? 50_000;
  if (!Number.isSafeInteger(maximumStates) || maximumStates < 0) {
    throw new RangeError('maximumStates must be a non-negative safe integer.');
  }
  const conditions = options.forbiddenConditions ?? [];
  type Node = Readonly<{
    state: GameState; solution: readonly Direction[]; pushes: number; progress: readonly number[];
  }>;
  const initialProgress = conditions.map(() => 0);
  const queue: Node[] = [{ state: { ...initial, history: [] }, solution: [], pushes: 0, progress: initialProgress }];
  const visited = new Set([stateKey(initial, initialProgress)]);
  let exploredStates = 0;
  let forbiddenTransitions = 0;
  const summary = () => ({ exploredStates, discoveredStates: visited.size, forbiddenTransitions });

  while (exploredStates < queue.length) {
    if (exploredStates >= maximumStates) {
      return { status: 'budget-exhausted', ...summary() };
    }
    const node = queue[exploredStates++]!;
    if (node.state.status === 'won') {
      return { status: 'solved', solution: node.solution, pushes: node.pushes, ...summary() };
    }
    for (const direction of directions) {
      const result = move(node.state, direction);
      if (!result.didMove) continue;
      if (options.forbiddenTransition?.(node.state, result)) {
        forbiddenTransitions += 1;
        continue;
      }
      const progress = conditions.map((condition, index) =>
        advanceProof(condition, node.progress[index]!, result.events));
      if (conditions.some((condition, index) => proofSatisfied(condition, progress[index]!))) {
        forbiddenTransitions += 1;
        continue;
      }
      const key = stateKey(result.state, progress);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({
        state: { ...result.state, history: [] },
        solution: [...node.solution, direction],
        pushes: node.pushes + result.events.filter((event) => event.type === 'block-pushed').length,
        progress,
      });
    }
  }
  return { status: 'proven-unsolved', ...summary() };
}
