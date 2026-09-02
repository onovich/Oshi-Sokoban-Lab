import type {
  BlockDefinition,
  Cell,
  Direction,
  DomainEvent,
  GateDefinition,
  GateTraversal,
  GameSnapshot,
  GameState,
  GoalDefinition,
  LevelDefinition,
  MoveResult,
  PathDefinition,
  PathState,
  PositionedEntity,
  ShapedEntityDefinition,
} from './types';
import { validateLevel } from './level-validation';

const directionOffsets: Readonly<Record<Direction, Cell>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function copyCell(cell: Cell): Cell {
  return { x: cell.x, y: cell.y };
}

function cellsEqual(left: Cell, right: Cell): boolean {
  return left.x === right.x && left.y === right.y;
}

function isInBounds(level: LevelDefinition, cell: Cell): boolean {
  return cell.x >= 0 && cell.x < level.width && cell.y >= 0 && cell.y < level.height;
}

function entityCells(entity: ShapedEntityDefinition): readonly Cell[] {
  return entity.shape.map((localCell) => ({
    x: entity.position.x + localCell.x,
    y: entity.position.y + localCell.y,
  }));
}

function occupies(entity: ShapedEntityDefinition, cell: Cell): boolean {
  return entityCells(entity).some((entityCell) => cellsEqual(entityCell, cell));
}

function cloneEntity<T extends ShapedEntityDefinition>(entity: T): PositionedEntity<T> {
  return {
    ...entity,
    position: copyCell(entity.position),
    origin: copyCell(entity.position),
    shape: entity.shape.map(copyCell),
  };
}

function snapshot(state: GameState): GameSnapshot {
  return {
    player: copyCell(state.player),
    blocks: state.blocks.map((block) => ({ ...block, position: copyCell(block.position) })),
    goals: state.goals.map((goal) => ({ ...goal, position: copyCell(goal.position) })),
    gates: state.gates.map((gate) => ({ ...gate, position: copyCell(gate.position) })),
    spikes: state.spikes.map((spike) => ({ ...spike, position: copyCell(spike.position) })),
    paths: state.paths.map((path) => ({ ...path })),
    moves: state.moves,
    remainingSeconds: state.remainingSeconds,
  };
}

function isWall(level: LevelDefinition, cell: Cell): boolean {
  return (
    level.walls.some((wall) => cellsEqual(wall, cell)) ||
    (level.dynamicWalls ?? []).some((wall) => occupies(wall, cell))
  );
}

function isTerrainGoal(level: LevelDefinition, cell: Cell): boolean {
  return level.terrainGoals.some((goal) => cellsEqual(goal, cell));
}

function isTerrainSpike(level: LevelDefinition, cell: Cell): boolean {
  return level.terrainSpikes.some((spike) => cellsEqual(spike, cell));
}

export function isBlockSolved(state: GameState, block: PositionedEntity<BlockDefinition>): boolean {
  return !block.isFake && entityCells(block).every(
    (cell) =>
      isTerrainGoal(state.level, cell) ||
      state.goals.some((goal) => goal.number === block.number && occupies(goal, cell)),
  );
}

function allRealBlocksInGoals(state: GameState): boolean {
  return state.blocks.filter((block) => !block.isFake).every((block) => isBlockSolved(state, block));
}

function canPlaceBlock(state: GameState, block: PositionedEntity<BlockDefinition>, position: Cell): boolean {
  const candidate = { ...block, position };
  return entityCells(candidate).every(
    (cell) =>
      isInBounds(state.level, cell) &&
      !isWall(state.level, cell) &&
      !cellsEqual(state.player, cell) &&
      !state.blocks.some((other) => other.id !== block.id && occupies(other, cell)) &&
      !state.gates.some((gate) => occupies(gate, cell)),
  );
}

function canPlaceGoal(state: GameState, goal: PositionedEntity<GoalDefinition>, position: Cell): boolean {
  const candidate = { ...goal, position };
  return entityCells(candidate).every(
    (cell) =>
      isInBounds(state.level, cell) &&
      !isWall(state.level, cell) &&
      !cellsEqual(state.player, cell) &&
      !isTerrainGoal(state.level, cell) &&
      !state.blocks.some((block) => occupies(block, cell)) &&
      !state.goals.some((other) => other.id !== goal.id && occupies(other, cell)) &&
      !state.gates.some((gate) => occupies(gate, cell)),
  );
}

function canResetGoal(state: GameState, goal: PositionedEntity<GoalDefinition>): boolean {
  const candidate = { ...goal, position: goal.origin };
  return entityCells(candidate).every(
    (cell) =>
      isInBounds(state.level, cell) &&
      !isWall(state.level, cell) &&
      !cellsEqual(state.player, cell) &&
      !isTerrainGoal(state.level, cell) &&
      !state.goals.some((other) => other.id !== goal.id && occupies(other, cell)) &&
      !state.gates.some((gate) => occupies(gate, cell)),
  );
}

function canPlaceGate(state: GameState, gate: PositionedEntity<GateDefinition>, position: Cell): boolean {
  const candidate = { ...gate, position };
  return entityCells(candidate).every(
    (cell) =>
      isInBounds(state.level, cell) &&
      !isWall(state.level, cell) &&
      !cellsEqual(state.player, cell) &&
      !state.blocks.some((block) => occupies(block, cell)) &&
      !state.gates.some((other) => other.id !== gate.id && occupies(other, cell)),
  );
}

/**
 * Gate traversal projects the role beyond the paired exit. That projection is
 * not a physical Gate placement: the role's own departure cell is therefore
 * open, while walls, Blocks, and other Gates still block the exit.
 */
function canUseGateExit(state: GameState, gate: PositionedEntity<GateDefinition>, position: Cell): boolean {
  const candidate = { ...gate, position };
  return entityCells(candidate).every(
    (cell) =>
      isInBounds(state.level, cell) &&
      !isWall(state.level, cell) &&
      !state.blocks.some((block) => occupies(block, cell)) &&
      !state.gates.some((other) => other.id !== gate.id && occupies(other, cell)),
  );
}

function linkedGate(state: GameState, gate: PositionedEntity<GateDefinition>): PositionedEntity<GateDefinition> | undefined {
  return gate.nextGateId ? state.gates.find((candidate) => candidate.id === gate.nextGateId) : undefined;
}

function canTraverseGate(state: GameState, gate: PositionedEntity<GateDefinition>, offset: Cell): boolean {
  const exit = linkedGate(state, gate);
  if (!gate.nextGateId) {
    return true;
  }
  if (!exit) {
    return false;
  }
  return canUseGateExit(state, exit, { x: exit.position.x + offset.x, y: exit.position.y + offset.y });
}

function findRainDestination(state: GameState, offset: Cell): Cell {
  let destination = state.player;

  while (true) {
    const candidate = { x: destination.x + offset.x, y: destination.y + offset.y };
    const blocked =
      !isInBounds(state.level, candidate) ||
      isWall(state.level, candidate) ||
      state.blocks.some((block) => occupies(block, candidate)) ||
      state.goals.some((goal) => goal.movable && occupies(goal, candidate));
    if (blocked) {
      return destination;
    }
    const gate = state.gates.find((candidateGate) => occupies(candidateGate, candidate));
    if (gate) {
      return canTraverseGate(state, gate, offset) ? candidate : destination;
    }
    destination = candidate;
  }
}

function isSpikeAt(state: GameState, cell: Cell): boolean {
  return isTerrainSpike(state.level, cell) || state.spikes.some((spike) => occupies(spike, cell));
}

function spikeContactCells(
  state: GameState,
  entity: ShapedEntityDefinition,
): readonly Cell[] {
  return entityCells(entity).filter((cell) => isSpikeAt(state, cell)).map(copyCell);
}

type ResetResolution = Readonly<{
  state: GameState;
  events: readonly DomainEvent[];
  conflict?: string;
}>;

function resetHazardObjects(state: GameState): ResetResolution {
  let next = state;
  const events: DomainEvent[] = [];

  for (const block of next.blocks) {
    if (!entityCells(block).some((cell) => isSpikeAt(next, cell))) continue;
    if (!canPlaceBlock(next, block, block.origin)) {
      return { state, events: [], conflict: `Reset conflict: block "${block.id}" cannot return to its origin.` };
    }
    next = {
      ...next,
      blocks: next.blocks.map((candidate) =>
        candidate.id === block.id ? { ...candidate, position: copyCell(candidate.origin) } : candidate,
      ),
    };
    events.push({
      type: 'object-reset', entityType: 'block', entityId: block.id, reason: 'spike',
      from: copyCell(block.position), to: copyCell(block.origin),
      contactCells: spikeContactCells(state, block),
    });
  }

  for (const gate of next.gates) {
    if (!entityCells(gate).some((cell) => isSpikeAt(next, cell))) continue;
    if (!canPlaceGate(next, gate, gate.origin)) {
      return { state, events: [], conflict: `Reset conflict: gate "${gate.id}" cannot return to its origin.` };
    }
    next = {
      ...next,
      gates: next.gates.map((candidate) =>
        candidate.id === gate.id ? { ...candidate, position: copyCell(candidate.origin) } : candidate,
      ),
    };
    events.push({
      type: 'object-reset', entityType: 'gate', entityId: gate.id, reason: 'spike',
      from: copyCell(gate.position), to: copyCell(gate.origin),
      contactCells: spikeContactCells(state, gate),
    });
  }

  for (const goal of next.goals) {
    if (!entityCells(goal).some((cell) => isSpikeAt(next, cell))) continue;
    if (!canResetGoal(next, goal)) {
      return { state, events: [], conflict: `Reset conflict: goal "${goal.id}" cannot return to its origin.` };
    }
    next = {
      ...next,
      goals: next.goals.map((candidate) =>
        candidate.id === goal.id ? { ...candidate, position: copyCell(candidate.origin) } : candidate,
      ),
    };
    events.push({
      type: 'object-reset', entityType: 'goal', entityId: goal.id, reason: 'spike',
      from: copyCell(goal.position), to: copyCell(goal.origin),
      contactCells: spikeContactCells(state, goal),
    });
  }

  return { state: next, events };
}

function nextPathState(path: PathState, definition: PathDefinition): PathState {
  const lastIndex = definition.nodes.length - 1;
  if (lastIndex <= 0) {
    return path;
  }

  let nextIndex = path.currentNodeIndex + path.direction;
  let direction = path.direction;

  if (definition.loop === 'loop') {
    nextIndex = (nextIndex + definition.nodes.length) % definition.nodes.length;
  } else if (definition.loop === 'pingPong') {
    if (nextIndex > lastIndex) {
      nextIndex = lastIndex - 1;
      direction = -1;
    } else if (nextIndex < 0) {
      nextIndex = 1;
      direction = 1;
    }
  } else {
    nextIndex = Math.min(lastIndex, Math.max(0, nextIndex));
  }

  return { ...path, currentNodeIndex: nextIndex, direction };
}

function cellsAlongPath(start: Cell, end: Cell): readonly Cell[] {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  if (length === 0) {
    return [];
  }

  const stepX = Math.sign(deltaX);
  const stepY = Math.sign(deltaY);
  return Array.from({ length }, (_, index) => ({
    x: start.x + stepX * (index + 1),
    y: start.y + stepY * (index + 1),
  }));
}

function canMovePathSpike(
  state: GameState,
  spike: PositionedEntity<ShapedEntityDefinition>,
  destination: Cell,
): boolean {
  return cellsAlongPath(spike.position, destination).every((anchor) =>
    spike.shape.every((localCell) => {
      const cell = { x: anchor.x + localCell.x, y: anchor.y + localCell.y };
      return (
        isInBounds(state.level, cell) &&
        !isWall(state.level, cell) &&
        !isTerrainSpike(state.level, cell) &&
        !state.blocks.some((block) => occupies(block, cell)) &&
        !state.spikes.some((other) => other.id !== spike.id && occupies(other, cell))
      );
    }),
  );
}

function advancePaths(state: GameState): GameState {
  let spikes = state.spikes;
  const paths = state.paths.map((path) => {
    const definition = state.level.paths.find((candidate) => candidate.id === path.id);
    if (!definition) {
      return path;
    }

    const spike = spikes.find((candidate) => candidate.id === definition.travelerId);
    if (!spike) {
      return path;
    }

    const candidatePath = nextPathState(path, definition);
    const destination = definition.nodes[candidatePath.currentNodeIndex];
    if (!destination || !canMovePathSpike({ ...state, spikes }, spike, destination)) {
      return path;
    }

    spikes = spikes.map((candidate) =>
      candidate.id === spike.id ? { ...candidate, position: copyCell(destination) } : candidate,
    );
    return candidatePath;
  });

  return { ...state, spikes, paths };
}

function resolveTurn(state: GameState, playerTouchedSpike: boolean): ResetResolution {
  if (playerTouchedSpike) {
    return { state: resetAfterSpikeDeath(state), events: [{ type: 'death-reset', reason: 'spike' }] };
  }
  const resetResolution = resetHazardObjects(state);
  if (resetResolution.conflict) {
    return resetResolution;
  }
  const afterPaths = advancePaths(resetResolution.state);
  if (isSpikeAt(afterPaths, afterPaths.player)) {
    return { state: resetAfterSpikeDeath(afterPaths), events: [{ type: 'death-reset', reason: 'spike' }] };
  }
  if (afterPaths.level.stepLimit !== undefined && afterPaths.moves >= afterPaths.level.stepLimit) {
    return { state: { ...afterPaths, status: 'lost' }, events: resetResolution.events };
  }
  if (allRealBlocksInGoals(afterPaths)) {
    return { state: { ...afterPaths, status: 'won' }, events: resetResolution.events };
  }
  return { state: { ...afterPaths, status: 'playing' }, events: resetResolution.events };
}

export function createGame(level: LevelDefinition): GameState {
  const issues = validateLevel(level);
  if (issues.length > 0) {
    throw new Error(`Invalid level "${level.id}": ${issues.join(' ')}`);
  }
  return {
    level,
    player: copyCell(level.player),
    blocks: level.blocks.map(cloneEntity),
    goals: level.goals.map(cloneEntity),
    gates: level.gates.map(cloneEntity),
    spikes: level.spikes.map(cloneEntity),
    paths: level.paths.map((path) => ({ id: path.id, currentNodeIndex: 0, direction: 1 })),
    moves: 0,
    remainingSeconds: level.timeLimitSeconds,
    status: 'playing',
    history: [],
  };
}

function resetAfterSpikeDeath(state: GameState): GameState {
  return {
    ...state,
    player: copyCell(state.level.player),
    blocks: state.level.blocks.map(cloneEntity),
    goals: state.level.goals.map(cloneEntity),
    gates: state.level.gates.map(cloneEntity),
    spikes: state.level.spikes.map(cloneEntity),
    paths: state.level.paths.map((path) => ({ id: path.id, currentNodeIndex: 0, direction: 1 })),
    moves: 0,
    remainingSeconds: state.level.timeLimitSeconds,
    status: 'playing',
    history: [],
  };
}

export function move(state: GameState, direction: Direction): MoveResult {
  if (state.status !== 'playing') {
    return { state, didMove: false, events: [] };
  }

  const offset = directionOffsets[direction];
  const adjacent = { x: state.player.x + offset.x, y: state.player.y + offset.y };
  if (!isInBounds(state.level, adjacent) || isWall(state.level, adjacent)) {
    return { state, didMove: false, events: [] };
  }

  const block = state.blocks.find((candidate) => occupies(candidate, adjacent));
  const goalAtAdjacent = state.goals.find((candidate) => occupies(candidate, adjacent));
  const adjacentGoalPushable =
    goalAtAdjacent?.movable === true &&
    canPlaceGoal(state, goalAtAdjacent, {
      x: goalAtAdjacent.position.x + offset.x,
      y: goalAtAdjacent.position.y + offset.y,
    });
  const gateAtAdjacent = state.gates.find((candidate) => occupies(candidate, adjacent));
  const adjacentGateTraversable =
    gateAtAdjacent !== undefined && canTraverseGate(state, gateAtAdjacent, offset);
  const adjacentGatePushable =
    gateAtAdjacent !== undefined &&
    !adjacentGateTraversable &&
    canPlaceGate(state, gateAtAdjacent, {
      x: gateAtAdjacent.position.x + offset.x,
      y: gateAtAdjacent.position.y + offset.y,
    });
  const hasAdjacentAction = Boolean(block) || adjacentGoalPushable || adjacentGateTraversable || adjacentGatePushable;
  let target =
    state.level.weather === 'rain' && !hasAdjacentAction
      ? findRainDestination(state, offset)
      : adjacent;
  let blocks = state.blocks;
  let goals = state.goals;
  let gates = state.gates;
  let gateEntry: Cell | undefined;
  let gateExit: Cell | undefined;
  let gateEntryId: string | undefined;
  let gateExitId: string | undefined;
  const events: DomainEvent[] = [];

  if (block) {
    const nextPosition = { x: block.position.x + offset.x, y: block.position.y + offset.y };
    if (!canPlaceBlock(state, block, nextPosition)) {
      return { state, didMove: false, events: [] };
    }
    blocks = state.blocks.map((candidate) =>
      candidate.id === block.id ? { ...candidate, position: nextPosition } : candidate,
    );
    events.push({
      type: 'block-pushed',
      entityId: block.id,
      from: copyCell(block.position),
      to: copyCell(nextPosition),
    });
  } else {
    const goal = goalAtAdjacent;
    if (goal?.movable) {
      const nextPosition = { x: goal.position.x + offset.x, y: goal.position.y + offset.y };
      if (canPlaceGoal(state, goal, nextPosition)) {
        goals = state.goals.map((candidate) =>
          candidate.id === goal.id ? { ...candidate, position: nextPosition } : candidate,
        );
        events.push({
          type: 'goal-pushed',
          entityId: goal.id,
          from: copyCell(goal.position),
          to: copyCell(nextPosition),
        });
      } else {
        events.push({
          type: 'goal-crossed',
          entityId: goal.id,
          at: copyCell(adjacent),
        });
      }
    } else {
      const gate = state.gates.find((candidate) => occupies(candidate, target));
      if (gate) {
        if (canTraverseGate(state, gate, offset)) {
          const exit = linkedGate(state, gate);
          if (exit) {
            gateEntry = target;
            gateExit = exit.position;
            gateEntryId = gate.id;
            gateExitId = exit.id;
            target = { x: exit.position.x + offset.x, y: exit.position.y + offset.y };
          }
        } else if (cellsEqual(target, adjacent)) {
          const nextPosition = { x: gate.position.x + offset.x, y: gate.position.y + offset.y };
          if (!canPlaceGate(state, gate, nextPosition)) {
            return { state, didMove: false, events: [] };
          }
          gates = state.gates.map((candidate) =>
            candidate.id === gate.id ? { ...candidate, position: nextPosition } : candidate,
          );
          events.push({
            type: 'gate-pushed',
            entityId: gate.id,
            from: copyCell(gate.position),
            to: copyCell(nextPosition),
          });
        }
      }
    }
  }

  if (cellsEqual(target, state.player) && !gateEntry) {
    return { state, didMove: false, events: [] };
  }

  if (
    state.level.weather === 'rain'
    && !hasAdjacentAction
    && !cellsEqual(target, adjacent)
  ) {
    events.push({
      type: 'rain-slid',
      direction,
      from: copyCell(state.player),
      to: copyCell(target),
    });
  }

  const working: GameState = {
    ...state,
    player: target,
    blocks,
    goals,
    gates,
    moves: state.moves + 1,
    history: [...state.history, snapshot(state)],
  };

  const traversedCells = gateEntry
    ? [...cellsAlongPath(state.player, gateEntry), target]
    : state.level.weather === 'rain' && !block
      ? cellsAlongPath(state.player, target)
      : [target];
  const playerTouchedSpike = traversedCells.some((cell) => isSpikeAt(state, cell));
  const resolution = resolveTurn(working, playerTouchedSpike);
  if (resolution.conflict) {
    return { state, didMove: false, events: [], event: resolution.conflict };
  }
  events.push(...resolution.events);
  const gateTraversal: GateTraversal | undefined = gateEntry && gateExit
    ? {
        direction,
        from: copyCell(state.player),
        entry: copyCell(gateEntry),
        exit: copyCell(gateExit),
        to: copyCell(target),
      }
    : undefined;
  if (gateTraversal && gateEntryId && gateExitId) {
    events.push({
      type: 'gate-traversed',
      entryGateId: gateEntryId,
      exitGateId: gateExitId,
      ...gateTraversal,
    });
  }
  return {
    state: resolution.state,
    didMove: true,
    events,
    gateTraversal,
  };
}

export function undo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous) {
    return state;
  }
  return {
    ...state,
    ...previous,
    status: 'playing',
    history: state.history.slice(0, -1),
  };
}

export function restart(state: GameState): GameState {
  return createGame(state.level);
}

export function tick(state: GameState, elapsedSeconds: number): GameState {
  if (state.status !== 'playing' || state.remainingSeconds === undefined || elapsedSeconds <= 0) {
    return state;
  }

  const remainingSeconds = Math.max(0, state.remainingSeconds - elapsedSeconds);
  return {
    ...state,
    remainingSeconds,
    status: remainingSeconds === 0 ? 'lost' : 'playing',
  };
}
