import { createGame, move } from '../engine/game-engine';
import type {
  Direction,
  DomainEvent,
  GameState,
  LevelAnalysis,
  LevelSpec,
} from '../engine/types';

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

function eventKeys(event: DomainEvent): readonly string[] {
  const keys = [`event:${event.type}`];
  if ('entityId' in event) keys.push(`event:${event.type}:${event.entityId}`);
  if (event.type === 'object-reset') {
    keys.push(`event:${event.type}:${event.entityType}`);
    keys.push(`event:${event.type}:${event.entityType}:${event.entityId}`);
  }
  if (event.type === 'gate-traversed') {
    keys.push(`event:${event.type}:entry:${event.entryGateId}`);
    keys.push(`event:${event.type}:exit:${event.exitGateId}`);
  }
  if ('direction' in event) keys.push(`event:${event.type}:${event.direction}`);
  if ('from' in event && 'to' in event) {
    const transition = `from:${event.from.x},${event.from.y}:to:${event.to.x},${event.to.y}`;
    keys.push(`event:${event.type}:${transition}`);
    if ('entityId' in event) keys.push(`event:${event.type}:${event.entityId}:${transition}`);
  }
  return keys;
}

function eventsMatch(events: readonly DomainEvent[], predicate: string): boolean {
  return events.some((event) => eventKeys(event).includes(predicate));
}

type CompiledPredicate =
  | Readonly<{ kind: 'event'; event: string; target: 1 }>
  | Readonly<{ kind: 'count'; event: string; target: number }>
  | Readonly<{ kind: 'sequence'; events: readonly string[]; target: number }>;

function compilePredicate(predicate: string): CompiledPredicate {
  const count = /^event-count:(\d+):(event:.+)$/.exec(predicate);
  if (count) {
    const target = Number(count[1]);
    if (!Number.isSafeInteger(target) || target < 1) {
      throw new Error(`Invalid event-count predicate "${predicate}".`);
    }
    return { kind: 'count', event: count[2]!, target };
  }

  if (predicate.startsWith('event-sequence:')) {
    const events = predicate.slice('event-sequence:'.length).split('>').filter(Boolean);
    if (events.length < 2 || events.some((event) => !event.startsWith('event:'))) {
      throw new Error(`Invalid event-sequence predicate "${predicate}".`);
    }
    return { kind: 'sequence', events, target: events.length };
  }

  if (!predicate.startsWith('event:')) {
    throw new Error(`Unknown level predicate "${predicate}".`);
  }
  return { kind: 'event', event: predicate, target: 1 };
}

function advancePredicate(
  predicate: CompiledPredicate,
  progress: number,
  events: readonly DomainEvent[],
): number {
  if (progress >= predicate.target) return predicate.target;
  if (predicate.kind === 'event') {
    return eventsMatch(events, predicate.event) ? 1 : progress;
  }
  if (predicate.kind === 'count') {
    const matches = events.filter((event) => eventKeys(event).includes(predicate.event)).length;
    return Math.min(predicate.target, progress + matches);
  }

  let next = progress;
  for (const event of events) {
    const expected = predicate.events[next];
    if (expected && eventKeys(event).includes(expected)) next += 1;
    if (next >= predicate.target) break;
  }
  return next;
}

function pushCount(events: readonly DomainEvent[]): number {
  return events.filter((event) =>
    event.type === 'block-pushed' || event.type === 'goal-pushed' || event.type === 'gate-pushed',
  ).length;
}

function findSolution(
  spec: LevelSpec,
  maximumStates: number,
  forbiddenPredicate?: string,
): SearchResult {
  const initial = withoutHistory(createGame(spec.board));
  const criticalPredicate = compilePredicate(spec.theorem.criticalEvent);
  const forbidden = forbiddenPredicate ? compilePredicate(forbiddenPredicate) : undefined;
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
          ? advancePredicate(forbidden, node.forbiddenProgress, result.events)
          : 0;
        if (forbidden && forbiddenProgress >= forbidden.target) continue;

        const eventPushes = pushCount(result.events);
        const pushes = node.pushes + eventPushes;
        const criticalProgress = advancePredicate(
          criticalPredicate,
          node.criticalProgress,
          result.events,
        );
        const criticalNow =
          node.criticalProgress < criticalPredicate.target &&
          criticalProgress >= criticalPredicate.target;
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
      return { exploredStates, node: winners[0] };
    }
    frontier = nextFrontier;
  }

  return { exploredStates };
}

function proofCriticalElements(spec: LevelSpec): readonly string[] {
  const predicates = spec.theorem.requiredPredicates;
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
  const bypassExists = solved.node !== undefined && spec.theorem.requiredPredicates.some(
    (predicate) => findSolution(spec, maximumStates, predicate).node !== undefined,
  );
  const analysis: LevelAnalysis = solved.node
    ? {
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
        solvable: false,
        optimalMoves: 0,
        optimalPushes: 0,
        insightTailPushes: 0,
        bypassExists: false,
        proofCriticalElements: proofCriticalElements(spec),
      };

  return { analysis, solution: solved.node?.solution, exploredStates: solved.exploredStates };
}
