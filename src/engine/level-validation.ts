import type { Cell, LevelDefinition, PathDefinition, ShapedEntityDefinition } from './types';

function sameCell(left: Cell, right: Cell): boolean {
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

function entitiesOverlap(left: ShapedEntityDefinition, right: ShapedEntityDefinition): boolean {
  return entityCells(left).some((leftCell) => entityCells(right).some((rightCell) => sameCell(leftCell, rightCell)));
}

function addEntityIssues(level: LevelDefinition, entity: ShapedEntityDefinition, label: string, issues: string[]): void {
  if (entity.shape.length === 0) {
    issues.push(`${label} "${entity.id}" has no cells.`);
  }
  if (entityCells(entity).some((cell) => !isInBounds(level, cell))) {
    issues.push(`${label} "${entity.id}" extends outside the board.`);
  }
}

function addPathIssues(level: LevelDefinition, path: PathDefinition, spikeIds: ReadonlySet<string>, issues: string[]): void {
  if (!spikeIds.has(path.travelerId)) {
    issues.push(`Path "${path.id}" must reference a spike traveler.`);
  }
  if (path.nodes.length < 2) {
    issues.push(`Path "${path.id}" needs at least two nodes.`);
  }
  if (path.nodes.some((node) => !isInBounds(level, node))) {
    issues.push(`Path "${path.id}" has a node outside the board.`);
  }
  for (let index = 1; index < path.nodes.length; index += 1) {
    const previous = path.nodes[index - 1]!;
    const current = path.nodes[index]!;
    if (Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) !== 1) {
      issues.push(`Path "${path.id}" must use unit axis-aligned steps.`);
      break;
    }
  }
}

function addDuplicateIdIssues(ids: readonly string[], issues: string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push(`Entity id "${id}" is duplicated.`);
    }
    seen.add(id);
  }
}

function addHardPlacementIssues(level: LevelDefinition, issues: string[]): void {
  const hardEntities = [...level.blocks, ...level.gates, ...(level.dynamicWalls ?? [])];

  for (const entity of hardEntities) {
    if (entityCells(entity).some((cell) => level.walls.some((wall) => sameCell(wall, cell)))) {
      issues.push(`Entity "${entity.id}" overlaps a painted wall.`);
    }
    if (entityCells(entity).some((cell) => sameCell(level.player, cell))) {
      issues.push(`Player starts inside hard entity "${entity.id}".`);
    }
  }

  for (let index = 0; index < hardEntities.length; index += 1) {
    const entity = hardEntities[index]!;
    for (const other of hardEntities.slice(index + 1)) {
      if (entitiesOverlap(entity, other)) {
        issues.push(`Entity "${entity.id}" overlaps "${other.id}".`);
      }
    }
  }
}

export function validateLevel(level: LevelDefinition): readonly string[] {
  const issues: string[] = [];
  if (!Number.isInteger(level.width) || !Number.isInteger(level.height) || level.width <= 0 || level.height <= 0) {
    issues.push('Board dimensions must be positive integers.');
  }
  if (!isInBounds(level, level.player)) {
    issues.push('Player starts outside the board.');
  }
  if (level.walls.some((wall) => !isInBounds(level, wall))) {
    issues.push('A painted wall is outside the board.');
  }
  if (level.terrainGoals.some((goal) => !isInBounds(level, goal))) {
    issues.push('A terrain goal is outside the board.');
  }
  if (level.terrainSpikes.some((spike) => !isInBounds(level, spike))) {
    issues.push('A terrain spike is outside the board.');
  }

  const entities = [
    ...level.blocks,
    ...level.goals,
    ...level.gates,
    ...level.spikes,
    ...(level.dynamicWalls ?? []),
  ];
  addDuplicateIdIssues(entities.map((entity) => entity.id), issues);
  for (const entity of entities) {
    addEntityIssues(level, entity, 'Entity', issues);
  }
  addHardPlacementIssues(level, issues);

  const gateIds = new Set(level.gates.map((gate) => gate.id));
  for (const gate of level.gates) {
    if (gate.nextGateId && !gateIds.has(gate.nextGateId)) {
      issues.push(`Gate "${gate.id}" links to missing gate "${gate.nextGateId}".`);
    }
  }

  addDuplicateIdIssues(level.paths.map((path) => path.id), issues);
  const spikeIds = new Set(level.spikes.map((spike) => spike.id));
  for (const path of level.paths) {
    addPathIssues(level, path, spikeIds, issues);
    const traveler = level.spikes.find((spike) => spike.id === path.travelerId);
    if (traveler && path.nodes[0] && !sameCell(traveler.position, path.nodes[0])) {
      issues.push(`Path "${path.id}" must start at its spike's position.`);
    }
  }

  if (level.stepLimit !== undefined && (!Number.isInteger(level.stepLimit) || level.stepLimit <= 0)) {
    issues.push('Step limit must be a positive integer.');
  }
  if (level.timeLimitSeconds !== undefined && level.timeLimitSeconds <= 0) {
    issues.push('Time limit must be positive.');
  }
  return issues;
}
