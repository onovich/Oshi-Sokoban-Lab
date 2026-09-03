import {
  advanceProof,
  evaluateOrderedMilestones,
  evaluateProofConditions,
  proofSatisfied,
} from '../course/proof-evaluator';
import type { ProofConditionEvaluation } from '../course/proof-evaluator';
import type { LevelSpec, ProofCondition, SearchStatus } from '../course/types';
import { createGame, isBlockSolved, move } from '../engine/game-engine';
import type {
  Cell,
  Direction,
  DomainEvent,
  GameState,
} from '../engine/types';

const directions: readonly Direction[] = ['up', 'right', 'down', 'left'];
const directionOffsets: Readonly<Record<Direction, Cell>> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export type SolverSearchMode = 'push-macro-a-star' | 'domain-dijkstra';
export type SolverActionKind =
  | 'walk'
  | 'push'
  | 'goal-push'
  | 'goal-cross'
  | 'gate-push'
  | 'gate-traverse'
  | 'rain-slide'
  | 'object-reset'
  | 'death-reset';

export type SolverAction = Readonly<{
  kind: SolverActionKind;
  kinds: readonly SolverActionKind[];
  directions: readonly Direction[];
  events: readonly DomainEvent[];
  pushes: number;
  signature: string;
}>;

export type SolverPlan = Readonly<{
  directions: readonly Direction[];
  actions: readonly SolverAction[];
  moves: number;
  pushes: number;
  coreSignature: string;
}>;

export type SolverMetrics = Readonly<{
  firstIrreversibleAction: number;
  meaningfulBranchPoints: number;
  interactionDepth: number;
  reachableRegionChanges: number;
  goalAssignments: Readonly<Record<string, string>>;
}>;

export type SolverDiagnostics = Readonly<{
  exploredStates: number;
  generatedActions: number;
  transpositionHits: number;
  deadlockPrunes: number;
  staticDeadSquarePrunes: number;
  dynamicDeadlockPrunes: number;
  deepestDeadlock: number;
  completePlanWindow: boolean;
}>;

export type SolverReport = Readonly<{
  status: SearchStatus;
  searchMode: SolverSearchMode;
  bestPlan?: SolverPlan;
  plans: readonly SolverPlan[];
  metrics: SolverMetrics;
  proof: Readonly<{
    required: readonly ProofConditionEvaluation[];
    milestones: readonly ProofConditionEvaluation[];
    insightTailPushes: number;
  }>;
  diagnostics: SolverDiagnostics;
}>;

export type SolverOptions = Readonly<{
  maximumStates?: number;
  maximumPlans?: number;
  pushSlack?: number;
  moveSlack?: number;
  /** Search branches are discarded as soon as any listed condition completes. */
  forbiddenConditions?: readonly ProofCondition[];
}>;

type SearchNode = Readonly<{
  state: GameState;
  directions: readonly Direction[];
  actions: readonly SolverAction[];
  moves: number;
  pushes: number;
  estimateMoves: number;
  depth: number;
  forbiddenProgress: readonly number[];
}>;

type GeneratedTransition = Readonly<{
  state: GameState;
  action: SolverAction;
}>;

type CostRecord = {
  moves: number;
  pushes: number;
  signatures: Set<string>;
};

class MinHeap<T> {
  readonly #values: T[] = [];

  constructor(private readonly compare: (left: T, right: T) => number) {}

  get size(): number {
    return this.#values.length;
  }

  peek(): T | undefined {
    return this.#values[0];
  }

  push(value: T): void {
    this.#values.push(value);
    let index = this.#values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.#values[parent]!, value) <= 0) break;
      this.#values[index] = this.#values[parent]!;
      index = parent;
    }
    this.#values[index] = value;
  }

  pop(): T | undefined {
    const first = this.#values[0];
    const tail = this.#values.pop();
    if (first === undefined || tail === undefined || this.#values.length === 0) return first;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.#values.length) break;
      const child = right < this.#values.length &&
        this.compare(this.#values[right]!, this.#values[left]!) < 0
        ? right
        : left;
      if (this.compare(tail, this.#values[child]!) <= 0) break;
      this.#values[index] = this.#values[child]!;
      index = child;
    }
    this.#values[index] = tail;
    return first;
  }
}

function withoutHistory(state: GameState): GameState {
  return { ...state, history: [] };
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function stateKey(state: GameState): string {
  const entities = (values: readonly { id: string; position: Cell }[]) =>
    values.map((entity) => `${entity.id}@${cellKey(entity.position)}`).join('|');
  const paths = state.paths.map((path) => `${path.id}@${path.currentNodeIndex},${path.direction}`).join('|');
  return [
    cellKey(state.player),
    entities(state.blocks),
    entities(state.goals),
    entities(state.gates),
    entities(state.spikes),
    paths,
    state.status,
    state.level.stepLimit === undefined ? '' : state.moves,
  ].join('~');
}

function searchKey(state: GameState, forbiddenProgress: readonly number[]): string {
  return `${stateKey(state)}~f:${forbiddenProgress.join(',')}`;
}

function countPushes(events: readonly DomainEvent[]): number {
  return events.filter((event) =>
    event.type === 'block-pushed' || event.type === 'goal-pushed' || event.type === 'gate-pushed',
  ).length;
}

function actionKinds(events: readonly DomainEvent[]): readonly SolverActionKind[] {
  const kinds: SolverActionKind[] = [];
  const include = (type: DomainEvent['type'], kind: SolverActionKind) => {
    if (events.some((event) => event.type === type)) kinds.push(kind);
  };
  include('death-reset', 'death-reset');
  include('object-reset', 'object-reset');
  include('gate-traversed', 'gate-traverse');
  include('rain-slid', 'rain-slide');
  include('gate-pushed', 'gate-push');
  include('goal-pushed', 'goal-push');
  include('block-pushed', 'push');
  include('goal-crossed', 'goal-cross');
  return kinds.length > 0 ? kinds : ['walk'];
}

function eventSignature(event: DomainEvent): string {
  if (event.type === 'gate-traversed') {
    return `${event.type}:${event.entryGateId}>${event.exitGateId}:${cellKey(event.to)}`;
  }
  if (event.type === 'death-reset') return event.type;
  if ('entityId' in event) {
    const transition = event.type === 'block-pushed' ||
      event.type === 'goal-pushed' ||
      event.type === 'gate-pushed' ||
      event.type === 'object-reset'
      ? `@${cellKey(event.from)}>${cellKey(event.to)}`
      : '';
    return `${event.type}:${event.entityId}${transition}`;
  }
  return event.type;
}

function makeAction(
  actionDirections: readonly Direction[],
  events: readonly DomainEvent[],
): SolverAction {
  const kinds = actionKinds(events);
  const kind = kinds[0]!;
  const signatureEvents = events.length > 0
    ? events.map(eventSignature).join('+')
    : actionDirections.join(',');
  return {
    kind,
    kinds,
    directions: actionDirections,
    events,
    pushes: countPushes(events),
    signature: `${kind}:${signatureEvents}`,
  };
}

function planSignature(actions: readonly SolverAction[]): string {
  const meaningful = actions.filter((action) => action.kind !== 'walk');
  return meaningful.map((action) => action.signature).join('>') || 'walk-only';
}

function isPlainPushBoard(spec: LevelSpec): boolean {
  const board = spec.board;
  return board.weather === 'clear' &&
    board.gates.length === 0 &&
    board.spikes.length === 0 &&
    board.terrainSpikes.length === 0 &&
    board.paths.length === 0 &&
    board.goals.every((goal) => !goal.movable) &&
    board.stepLimit === undefined &&
    board.timeLimitSeconds === undefined;
}

function generateStepTransitions(state: GameState): readonly GeneratedTransition[] {
  return directions.flatMap((direction): readonly GeneratedTransition[] => {
    const result = move(state, direction);
    if (!result.didMove || result.state.status === 'lost') return [];
    return [{
      state: withoutHistory(result.state),
      action: makeAction([direction], result.events),
    }];
  });
}

/**
 * Collapses every ordinary walking region into its reachable pushes. Walking
 * still goes through move(), and the shortest local walk is retained in each
 * macro, so the global solver never needs a second copy of collision rules.
 */
function generatePushMacros(state: GameState): readonly GeneratedTransition[] {
  type WalkNode = Readonly<{ state: GameState; directions: readonly Direction[] }>;
  const queue: WalkNode[] = [{ state, directions: [] }];
  const visited = new Set([cellKey(state.player)]);
  const candidates = new Map<string, GeneratedTransition>();
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    for (const direction of directions) {
      const result = move(current.state, direction);
      if (!result.didMove || result.state.status === 'lost') continue;
      const pushes = countPushes(result.events);
      if (pushes > 0 || result.events.some((event) => event.type !== 'block-pushed')) {
        if (pushes === 0) continue;
        const transition: GeneratedTransition = {
          state: withoutHistory(result.state),
          action: makeAction([...current.directions, direction], result.events),
        };
        const key = stateKey(transition.state);
        const previous = candidates.get(key);
        if (!previous || transition.action.directions.length < previous.action.directions.length) {
          candidates.set(key, transition);
        }
        continue;
      }

      const next = withoutHistory(result.state);
      const key = cellKey(next.player);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ state: next, directions: [...current.directions, direction] });
    }
  }

  return [...candidates.values()];
}

function wallInLevel(level: GameState['level'], cell: Cell): boolean {
  if (cell.x < 0 || cell.x >= level.width || cell.y < 0 || cell.y >= level.height) {
    return true;
  }
  if (level.walls.some((wall) => wall.x === cell.x && wall.y === cell.y)) return true;
  return (level.dynamicWalls ?? []).some((wall) => wall.shape.some((part) =>
    wall.position.x + part.x === cell.x && wall.position.y + part.y === cell.y));
}

function wallAt(state: GameState, cell: Cell): boolean {
  return wallInLevel(state.level, cell);
}

function hasStaticDeadlock(state: GameState): boolean {
  return state.blocks.some((block) => {
    if (block.isFake || block.shape.length !== 1 || isBlockSolved(state, block)) return false;
    const { x, y } = block.position;
    const up = wallAt(state, { x, y: y - 1 });
    const down = wallAt(state, { x, y: y + 1 });
    const left = wallAt(state, { x: x - 1, y });
    const right = wallAt(state, { x: x + 1, y });
    return (up || down) && (left || right);
  });
}

function fixedGoalCells(state: GameState): readonly Cell[] {
  return [
    ...state.level.terrainGoals,
    ...state.goals.filter((goal) => !goal.movable).flatMap((goal) => goal.shape.map((part) => ({
      x: goal.position.x + part.x,
      y: goal.position.y + part.y,
    }))),
  ];
}

/** Cells from which a one-cell Block can never reach any fixed Goal, even if
 * every movable object is removed. This reverse-pull analysis is conservative:
 * it may miss deadlocks, but it cannot reject a valid push route. */
function staticDeadSquares(state: GameState): ReadonlySet<string> {
  const reachable = new Set<string>();
  const queue: Cell[] = [];
  for (const goal of fixedGoalCells(state)) {
    if (wallAt(state, goal)) continue;
    const key = cellKey(goal);
    if (reachable.has(key)) continue;
    reachable.add(key);
    queue.push(goal);
  }

  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    for (const direction of directions) {
      const offset = directionOffsets[direction];
      const predecessor = { x: current.x - offset.x, y: current.y - offset.y };
      const pusher = { x: predecessor.x - offset.x, y: predecessor.y - offset.y };
      if (wallAt(state, predecessor) || wallAt(state, pusher)) continue;
      const key = cellKey(predecessor);
      if (reachable.has(key)) continue;
      reachable.add(key);
      queue.push(predecessor);
    }
  }

  const dead = new Set<string>();
  for (let y = 0; y < state.level.height; y += 1) {
    for (let x = 0; x < state.level.width; x += 1) {
      const cell = { x, y };
      const key = cellKey(cell);
      if (!wallAt(state, cell) && !reachable.has(key)) dead.add(key);
    }
  }
  return dead;
}

function hasStaticDeadSquare(state: GameState, deadSquares: ReadonlySet<string>): boolean {
  return state.blocks.some((block) =>
    !block.isFake &&
    block.shape.length === 1 &&
    !isBlockSolved(state, block) &&
    deadSquares.has(cellKey(block.position)));
}

function hasDynamicDeadlock(state: GameState): boolean {
  const singleCellBlocks = new Map(
    state.blocks.filter((block) => block.shape.length === 1)
      .map((block) => [cellKey(block.position), block] as const),
  );
  for (let y = 0; y < state.level.height - 1; y += 1) {
    for (let x = 0; x < state.level.width - 1; x += 1) {
      const square = [
        { x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 },
      ];
      if (!square.every((cell) => wallAt(state, cell) || singleCellBlocks.has(cellKey(cell)))) continue;
      const trapped = square.map((cell) => singleCellBlocks.get(cellKey(cell))).filter(Boolean);
      if (trapped.some((block) => block && !block.isFake && !isBlockSolved(state, block))) return true;
    }
  }
  return false;
}

function matchingLowerBound(state: GameState): number {
  const blocks = state.blocks.filter((block) => !block.isFake && !isBlockSolved(state, block));
  const goals = state.level.terrainGoals;
  if (
    state.level.goals.length > 0 ||
    blocks.some((block) => block.shape.length !== 1) ||
    blocks.length > goals.length ||
    goals.length > 12
  ) return 0;
  if (blocks.length === 0) return 0;

  const memo = new Map<string, number>();
  const visit = (blockIndex: number, usedMask: number): number => {
    if (blockIndex >= blocks.length) return 0;
    const key = `${blockIndex}:${usedMask}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    const block = blocks[blockIndex]!;
    let best = Number.POSITIVE_INFINITY;
    for (let goalIndex = 0; goalIndex < goals.length; goalIndex += 1) {
      const bit = 1 << goalIndex;
      if ((usedMask & bit) !== 0) continue;
      const goal = goals[goalIndex]!;
      const distance = Math.abs(block.position.x - goal.x) + Math.abs(block.position.y - goal.y);
      best = Math.min(best, distance + visit(blockIndex + 1, usedMask | bit));
    }
    memo.set(key, best);
    return best;
  };
  return visit(0, 0);
}

function compareNode(left: SearchNode, right: SearchNode): number {
  return left.estimateMoves - right.estimateMoves ||
    left.moves - right.moves ||
    left.pushes - right.pushes ||
    left.depth - right.depth;
}

function isBetterCost(moves: number, pushes: number, previous: CostRecord): boolean {
  return moves < previous.moves || (moves === previous.moves && pushes < previous.pushes);
}

function shouldVisit(
  visited: Map<string, CostRecord>,
  key: string,
  node: SearchNode,
  pushSlack: number,
  moveSlack: number,
): boolean {
  const signature = planSignature(node.actions);
  const previous = visited.get(key);
  if (!previous) {
    visited.set(key, { moves: node.moves, pushes: node.pushes, signatures: new Set([signature]) });
    return true;
  }
  if (isBetterCost(node.moves, node.pushes, previous)) {
    visited.set(key, { moves: node.moves, pushes: node.pushes, signatures: new Set([signature]) });
    return true;
  }
  const withinWindow = node.moves <= previous.moves + moveSlack && node.pushes <= previous.pushes + pushSlack;
  if (!withinWindow || previous.signatures.has(signature) || previous.signatures.size >= 3) return false;
  previous.signatures.add(signature);
  return true;
}

function toPlan(node: SearchNode): SolverPlan {
  return {
    directions: node.directions,
    actions: node.actions,
    moves: node.moves,
    pushes: node.pushes,
    coreSignature: planSignature(node.actions),
  };
}

function reachableRegionSignature(state: GameState, plain: boolean): string {
  if (!plain) return cellKey(state.player);
  type WalkNode = Readonly<{ state: GameState }>;
  const queue: WalkNode[] = [{ state }];
  const visited = new Set([cellKey(state.player)]);
  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    for (const direction of directions) {
      const result = move(current.state, direction);
      if (!result.didMove || result.events.length > 0 || result.state.status !== 'playing') continue;
      const key = cellKey(result.state.player);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ state: withoutHistory(result.state) });
    }
  }
  return [...visited].sort().join('|');
}

function goalAssignments(state: GameState): Readonly<Record<string, string>> {
  return Object.fromEntries(state.blocks.filter((block) => !block.isFake).map((block) => [
    block.id,
    block.shape.map((part) => `${block.position.x + part.x},${block.position.y + part.y}`).sort().join('|'),
  ]));
}

function metricsFor(spec: LevelSpec, plan: SolverPlan | undefined): SolverMetrics {
  if (!plan) {
    return {
      firstIrreversibleAction: -1,
      meaningfulBranchPoints: 0,
      interactionDepth: 0,
      reachableRegionChanges: 0,
      goalAssignments: {},
    };
  }

  const plain = isPlainPushBoard(spec);
  let state = withoutHistory(createGame(spec.board));
  let previousRegion = reachableRegionSignature(state, plain);
  let reachableRegionChanges = 0;
  for (const action of plan.actions) {
    for (const direction of action.directions) state = withoutHistory(move(state, direction).state);
    const region = reachableRegionSignature(state, plain);
    if (region !== previousRegion) reachableRegionChanges += 1;
    previousRegion = region;
  }

  return {
    firstIrreversibleAction: plan.actions.findIndex((action) =>
      action.pushes > 0 || action.kind === 'object-reset'),
    meaningfulBranchPoints: 0,
    interactionDepth: plan.actions.filter((action) => action.kind !== 'walk').length,
    reachableRegionChanges,
    goalAssignments: goalAssignments(state),
  };
}

function proofFor(spec: LevelSpec, plan: SolverPlan | undefined): SolverReport['proof'] {
  const batches = plan?.actions.map((action) => ({
    events: action.events,
    pushes: action.pushes,
  })) ?? [];
  const required = evaluateProofConditions(spec.theorem.proofConditions, batches);
  const milestones = evaluateOrderedMilestones(spec.theorem.milestones, batches);
  const finalMilestone = milestones.at(-1);
  const insightTailPushes = plan && finalMilestone?.satisfied
    ? plan.pushes - (finalMilestone.pushesAtCompletion ?? plan.pushes)
    : plan?.pushes ?? 0;
  return { required, milestones, insightTailPushes };
}

export function solveLevel(spec: LevelSpec, options: SolverOptions = {}): SolverReport {
  const maximumStates = options.maximumStates ?? 500_000;
  const maximumPlans = options.maximumPlans ?? 6;
  const pushSlack = options.pushSlack ?? 2;
  const moveSlack = options.moveSlack ?? 8;
  const forbiddenConditions = options.forbiddenConditions ?? [];
  const plain = isPlainPushBoard(spec);
  const searchMode: SolverSearchMode = plain ? 'push-macro-a-star' : 'domain-dijkstra';
  const initialState = withoutHistory(createGame(spec.board));
  const deadSquares = plain ? staticDeadSquares(initialState) : new Set<string>();
  let deadlockPrunes = 0;
  let staticDeadSquarePrunes = 0;
  let dynamicDeadlockPrunes = 0;
  let deepestDeadlock = 0;
  const initialCornerDeadlock = plain && hasStaticDeadlock(initialState);
  const initialDeadSquare = plain && hasStaticDeadSquare(initialState, deadSquares);
  const initialDynamicDeadlock = plain && hasDynamicDeadlock(initialState);
  if (initialCornerDeadlock || initialDeadSquare || initialDynamicDeadlock) {
    return {
      status: 'proven-unsolved',
      searchMode,
      plans: [],
      metrics: metricsFor(spec, undefined),
      proof: proofFor(spec, undefined),
      diagnostics: {
        exploredStates: 0,
        generatedActions: 0,
        transpositionHits: 0,
        deadlockPrunes: 1,
        staticDeadSquarePrunes: initialDeadSquare ? 1 : 0,
        dynamicDeadlockPrunes: initialDynamicDeadlock ? 1 : 0,
        deepestDeadlock: 0,
        completePlanWindow: true,
      },
    };
  }

  const initial: SearchNode = {
    state: initialState,
    directions: [],
    actions: [],
    moves: 0,
    pushes: 0,
    estimateMoves: plain ? matchingLowerBound(initialState) : 0,
    depth: 0,
    forbiddenProgress: forbiddenConditions.map(() => 0),
  };
  const frontier = new MinHeap<SearchNode>(compareNode);
  frontier.push(initial);
  const visited = new Map<string, CostRecord>();
  visited.set(searchKey(initialState, initial.forbiddenProgress), {
    moves: 0,
    pushes: 0,
    signatures: new Set(['walk-only']),
  });
  const winners = new Map<string, SearchNode>();
  let bestMoves: number | undefined;
  let bestPushes: number | undefined;
  let exploredStates = 0;
  let generatedActions = 0;
  let transpositionHits = 0;
  let meaningfulBranchPoints = 0;
  let budgetExhausted = false;

  while (frontier.size > 0) {
    const peek = frontier.peek()!;
    if (bestMoves !== undefined && peek.estimateMoves > bestMoves + moveSlack) break;
    if (exploredStates >= maximumStates) {
      budgetExhausted = true;
      break;
    }
    const node = frontier.pop()!;
    exploredStates += 1;
    const transitions = plain ? generatePushMacros(node.state) : generateStepTransitions(node.state);
    generatedActions += transitions.length;
    if (transitions.length > 1) meaningfulBranchPoints += 1;

    for (const transition of transitions) {
      const moves = node.moves + transition.action.directions.length;
      const pushes = node.pushes + transition.action.pushes;
      if (bestMoves !== undefined && moves > bestMoves + moveSlack) continue;
      if (bestPushes !== undefined && pushes > bestPushes + pushSlack) continue;
      const actions = [...node.actions, transition.action];
      const forbiddenProgress = forbiddenConditions.map((condition, index) =>
        advanceProof(condition, node.forbiddenProgress[index]!, transition.action.events));
      if (forbiddenConditions.some((condition, index) =>
        proofSatisfied(condition, forbiddenProgress[index]!))) continue;
      const candidate: SearchNode = {
        state: transition.state,
        directions: [...node.directions, ...transition.action.directions],
        actions,
        moves,
        pushes,
        estimateMoves: moves + (plain ? matchingLowerBound(transition.state) : 0),
        depth: node.depth + 1,
        forbiddenProgress,
      };

      if (transition.state.status === 'won') {
        const signature = planSignature(actions);
        const existing = winners.get(signature);
        if (!existing || compareNode(candidate, existing) < 0) winners.set(signature, candidate);
        if (
          bestMoves === undefined ||
          moves < bestMoves ||
          (moves === bestMoves && (bestPushes === undefined || pushes < bestPushes))
        ) {
          bestMoves = moves;
          bestPushes = pushes;
        }
        continue;
      }

      const cornerDeadlock = plain && hasStaticDeadlock(transition.state);
      const deadSquare = plain && hasStaticDeadSquare(transition.state, deadSquares);
      const dynamicDeadlock = plain && hasDynamicDeadlock(transition.state);
      if (cornerDeadlock || deadSquare || dynamicDeadlock) {
        deadlockPrunes += 1;
        if (deadSquare) staticDeadSquarePrunes += 1;
        if (dynamicDeadlock) dynamicDeadlockPrunes += 1;
        deepestDeadlock = Math.max(deepestDeadlock, candidate.depth);
        continue;
      }

      const key = searchKey(transition.state, forbiddenProgress);
      if (!shouldVisit(visited, key, candidate, pushSlack, moveSlack)) {
        transpositionHits += 1;
        continue;
      }
      frontier.push(candidate);
    }
  }

  const plans = [...winners.values()]
    .sort(compareNode)
    .filter((node) => bestMoves === undefined || (
      node.moves <= bestMoves + moveSlack &&
      node.pushes <= (bestPushes ?? node.pushes) + pushSlack
    ))
    .slice(0, maximumPlans)
    .map(toPlan);
  const bestPlan = plans[0];
  const baseMetrics = metricsFor(spec, bestPlan);
  const metrics = { ...baseMetrics, meaningfulBranchPoints };
  const completePlanWindow = !budgetExhausted;
  const status: SearchStatus = bestPlan
    ? 'solved'
    : budgetExhausted
      ? 'budget-exhausted'
      : 'proven-unsolved';

  return {
    status,
    searchMode,
    bestPlan,
    plans,
    metrics,
    proof: proofFor(spec, bestPlan),
    diagnostics: {
      exploredStates,
      generatedActions,
      transpositionHits,
      deadlockPrunes,
      staticDeadSquarePrunes,
      dynamicDeadlockPrunes,
      deepestDeadlock,
      completePlanWindow,
    },
  };
}
