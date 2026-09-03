import { createGame, move } from '../engine/game-engine';
import type {
  Direction,
  DomainEvent,
  GameState,
} from '../engine/types';
import { advanceProof, proofTarget } from '../course/proof-evaluator';
import { proofConditionKey } from '../course/proof-condition';
import type { LevelAnalysis, LevelSpec, ProofCondition } from '../course/types';

const directions: readonly Direction[] = ['up', 'right', 'down', 'left'];
const defaultMaximumStates = 200_000;

type SearchNode = Readonly<{
  state: GameState;
  solution: readonly Direction[];
  pushes: number;
  criticalProgress: number;
  criticalSeen: boolean;
  forbiddenProgress: number;
  pushesAtCritical?: number;
}>;

type SearchResult = Readonly<{
  exploredStates: number;
  exhausted: boolean;
  node?: SearchNode;
}>;

export type LevelAnalysisResult = Readonly<{
  analysis: LevelAnalysis;
  solution?: readonly Direction[];
  exploredStates: number;
}>;

function stateKey(state: GameState): string {
  const entities = (values: readonly { id: string; position: { x: number; y: number } }[]) =>
    values.map((entity) => `${entity.id}@${entity.position.x},${entity.position.y}`).join('|');
  const paths = state.paths.map((path) => `${path.id}@${path.currentNodeIndex},${path.direction}`).join('|');
  return [
    `${state.player.x},${state.player.y}`,
    entities(state.blocks),
    entities(state.goals),
    entities(state.gates),
    entities(state.spikes),
    paths,
    state.status,
    state.level.stepLimit === undefined ? '' : state.moves,
  ].join('~');
}

function withoutHistory(state: GameState): GameState {
  return { ...state, history: [] };
}

function pushCount(events: readonly DomainEvent[]): number {
  return events.filter((event) =>
    event.type === 'block-pushed' || event.type === 'goal-pushed' || event.type === 'gate-pushed',
  ).length;
}

function findSolution(
  spec: LevelSpec,
  maximumStates: number,
  forbiddenCondition?: ProofCondition,
): SearchResult {
  const initial = withoutHistory(createGame(spec.board));
  const criticalCondition = spec.theorem.milestones.at(-1) ?? spec.theorem.proofConditions[0];
  if (!criticalCondition) throw new Error(`${spec.id} has no proof condition.`);
  const forbidden = forbiddenCondition;
  let frontier: SearchNode[] = [{
    state: initial,
    solution: [],
    pushes: 0,
    criticalProgress: 0,
    criticalSeen: false,
    forbiddenProgress: 0,
  }];
  const searchStateKey = (node: Pick<SearchNode, 'state' | 'criticalProgress' | 'forbiddenProgress'>) =>
    `${stateKey(node.state)}~c${node.criticalProgress}~f${node.forbiddenProgress}`;
  const visited = new Map<string, number>([[searchStateKey(frontier[0]!), 0]]);
  let exploredStates = 0;

  while (frontier.length > 0 && exploredStates < maximumStates) {
    const nextFrontier: SearchNode[] = [];
    const winners: SearchNode[] = [];

    for (const node of frontier) {
      exploredStates += 1;
      if (exploredStates >= maximumStates) break;

      for (const direction of directions) {
        const result = move(node.state, direction);
        if (!result.didMove || result.state.status === 'lost') continue;

        const forbiddenProgress = forbidden
          ? advanceProof(forbidden, node.forbiddenProgress, result.events)
          : 0;
        if (forbidden && forbiddenProgress >= proofTarget(forbidden)) continue;

        const eventPushes = pushCount(result.events);
        const pushes = node.pushes + eventPushes;
        const criticalProgress = advanceProof(
          criticalCondition,
          node.criticalProgress,
          result.events,
        );
        const criticalNow =
          node.criticalProgress < proofTarget(criticalCondition) &&
          criticalProgress >= proofTarget(criticalCondition);
        const criticalSeen = node.criticalSeen || criticalNow;
        const candidate: SearchNode = {
          state: withoutHistory(result.state),
          solution: [...node.solution, direction],
          pushes,
          criticalProgress,
          criticalSeen,
          forbiddenProgress,
          pushesAtCritical: node.pushesAtCritical ?? (criticalNow ? pushes : undefined),
        };

        if (result.state.status === 'won') {
          winners.push(candidate);
          continue;
        }

        const key = searchStateKey(candidate);
        const bestPushes = visited.get(key);
        if (bestPushes === undefined || pushes < bestPushes) {
          visited.set(key, pushes);
          nextFrontier.push(candidate);
        }
      }
    }

    if (winners.length > 0) {
      winners.sort((left, right) => left.pushes - right.pushes);
      return { exploredStates, exhausted: false, node: winners[0] };
    }
    frontier = nextFrontier;
  }

  return { exploredStates, exhausted: frontier.length > 0 };
}

export function proofCriticalElements(spec: LevelSpec): readonly string[] {
  const predicates = spec.theorem.proofConditions.map(proofConditionKey);
  const references = new Set<string>();
  const addNamed = (prefix: string, entities: readonly { id: string }[]) => {
    for (const entity of entities) {
      if (predicates.some((predicate) => predicate.includes(entity.id))) {
        references.add(`${prefix}:${entity.id}`);
      }
    }
  };
  addNamed('block', spec.board.blocks);
  addNamed('goal', spec.board.goals);
  addNamed('gate', spec.board.gates);
  addNamed('spike', spec.board.spikes);

  if (predicates.some((predicate) => predicate.includes('event:rain-slid'))) {
    references.add('weather:rain');
  }
  if (predicates.some((predicate) => predicate.includes('event:gate-traversed'))) {
    for (const gate of spec.board.gates) references.add(`gate:${gate.id}`);
  }
  if (predicates.some((predicate) => predicate.includes('event:object-reset'))) {
    for (const spike of spec.board.terrainSpikes) {
      const reference = `terrain-spike:${spike.x},${spike.y}`;
      if (!spec.theorem.readabilityElements?.includes(reference)) references.add(reference);
    }
    for (const spike of spec.board.spikes) {
      const reference = `spike:${spike.id}`;
      if (!spec.theorem.readabilityElements?.includes(reference)) references.add(reference);
    }
  }
  return [...references];
}

export function analyzeLevel(spec: LevelSpec, maximumStates = defaultMaximumStates): LevelAnalysisResult {
  const solved = findSolution(spec, maximumStates);
  const bypassExists = solved.node !== undefined && spec.theorem.proofConditions.some(
    (condition) => findSolution(spec, maximumStates, condition).node !== undefined,
  );
  const analysis: LevelAnalysis = solved.node
    ? {
        status: 'solved',
        solvable: true,
        optimalMoves: solved.node.solution.length,
        optimalPushes: solved.node.pushes,
        insightTailPushes: solved.node.criticalSeen
          ? solved.node.pushes - (solved.node.pushesAtCritical ?? solved.node.pushes)
          : solved.node.pushes,
        bypassExists,
        proofCriticalElements: proofCriticalElements(spec),
      }
    : {
        status: solved.exhausted ? 'budget-exhausted' : 'proven-unsolved',
        solvable: false,
        optimalMoves: 0,
        optimalPushes: 0,
        insightTailPushes: 0,
        bypassExists: false,
        proofCriticalElements: proofCriticalElements(spec),
      };

  return { analysis, solution: solved.node?.solution, exploredStates: solved.exploredStates };
}
