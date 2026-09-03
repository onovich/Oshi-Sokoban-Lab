import type {
  Cell,
  LevelDefinition,
  ShapedEntityDefinition,
} from '../engine/types';
import type { LevelAnalysis, LevelSpec } from '../course/types';
import { analyzeLevel } from './level-analyzer';

export type LevelMutationKind = 'entity-removal' | 'mechanism-removal' | 'wall-insertion';
export type LevelMutationEffect =
  | 'invalid'
  | 'unsolvable'
  | 'bypass-created'
  | 'solution-changed'
  | 'unchanged';

export type LevelMutationResult = Readonly<{
  kind: LevelMutationKind;
  target: string;
  effect: LevelMutationEffect;
  proofCritical: boolean;
  classification: 'proof-critical' | 'readability' | 'redundant';
}>;

const cellKey = (value: Cell): string => `${value.x},${value.y}`;

function entityCells(entity: ShapedEntityDefinition): readonly Cell[] {
  return entity.shape.map((part) => ({
    x: entity.position.x + part.x,
    y: entity.position.y + part.y,
  }));
}

function mutationEffect(
  spec: LevelSpec,
  board: LevelDefinition,
  baseline: LevelAnalysis,
  maximumStates: number,
): LevelMutationEffect {
  try {
    const result = analyzeLevel({ ...spec, board }, maximumStates).analysis;
    if (!result.solvable) return 'unsolvable';
    if (result.bypassExists) return 'bypass-created';
    if (
      result.optimalMoves !== baseline.optimalMoves ||
      result.optimalPushes !== baseline.optimalPushes ||
      result.insightTailPushes !== baseline.insightTailPushes
    ) {
      return 'solution-changed';
    }
    return 'unchanged';
  } catch {
    return 'invalid';
  }
}

function result(
  kind: LevelMutationKind,
  target: string,
  effect: LevelMutationEffect,
  readabilityElements: readonly string[] = [],
): LevelMutationResult {
  const classification = effect !== 'unchanged'
    ? 'proof-critical'
    : readabilityElements.includes(target)
      ? 'readability'
      : 'redundant';
  return { kind, target, effect, proofCritical: effect !== 'unchanged', classification };
}

function baselineAnalysis(spec: LevelSpec, maximumStates: number): LevelAnalysis {
  const baseline = analyzeLevel(spec, maximumStates).analysis;
  if (!baseline.solvable || baseline.bypassExists) {
    throw new Error(`Cannot mutation-audit ${spec.id}: baseline is unsolved or bypassable.`);
  }
  return baseline;
}

function removeEntity(board: LevelDefinition, id: string): LevelDefinition | undefined {
  if (board.blocks.some((entity) => entity.id === id)) {
    return { ...board, blocks: board.blocks.filter((entity) => entity.id !== id) };
  }
  if (board.goals.some((entity) => entity.id === id)) {
    return { ...board, goals: board.goals.filter((entity) => entity.id !== id) };
  }
  if (board.gates.some((entity) => entity.id === id)) {
    return { ...board, gates: board.gates.filter((entity) => entity.id !== id) };
  }
  if (board.spikes.some((entity) => entity.id === id)) {
    return { ...board, spikes: board.spikes.filter((entity) => entity.id !== id) };
  }
  if (board.dynamicWalls?.some((entity) => entity.id === id)) {
    return { ...board, dynamicWalls: board.dynamicWalls.filter((entity) => entity.id !== id) };
  }
  return undefined;
}

function mutateProofElement(
  board: LevelDefinition,
  reference: string,
): Readonly<{ board: LevelDefinition; kind: LevelMutationKind }> | undefined {
  const [prefix, ...rest] = reference.split(':');
  const value = rest.join(':');
  if (prefix === 'weather' && value === 'rain') {
    return { board: { ...board, weather: 'clear' }, kind: 'mechanism-removal' };
  }
  if (prefix === 'terrain-spike') {
    return {
      board: {
        ...board,
        terrainSpikes: board.terrainSpikes.filter((cell) => cellKey(cell) !== value),
      },
      kind: 'mechanism-removal',
    };
  }
  const withoutEntity = removeEntity(board, value);
  return withoutEntity ? { board: withoutEntity, kind: 'entity-removal' } : undefined;
}

export function auditProofCriticalElements(
  spec: LevelSpec,
  maximumStates = 100_000,
): readonly LevelMutationResult[] {
  const baseline = baselineAnalysis(spec, maximumStates);
  const references = analyzeLevel(spec, maximumStates).analysis.proofCriticalElements;
  return references.map((reference) => {
    const mutation = mutateProofElement(spec.board, reference);
    if (!mutation) return result('entity-removal', `unknown:${reference}`, 'invalid');
    return result(
      mutation.kind,
      reference,
      mutationEffect(spec, mutation.board, baseline, maximumStates),
      spec.theorem.readabilityElements,
    );
  });
}

export function auditLevelMutations(
  spec: LevelSpec,
  maximumStates = 100_000,
): readonly LevelMutationResult[] {
  const baseline = baselineAnalysis(spec, maximumStates);
  const mutations: LevelMutationResult[] = [...auditProofCriticalElements(spec, maximumStates)];
  const alreadyAudited = new Set(mutations.map((mutation) => mutation.target));
  const entityGroups = [
    ['block', spec.board.blocks],
    ['goal', spec.board.goals],
    ['gate', spec.board.gates],
    ['spike', spec.board.spikes],
    ['wall', spec.board.dynamicWalls ?? []],
  ] as const;

  for (const [prefix, entities] of entityGroups) {
    for (const entity of entities) {
      if (alreadyAudited.has(`${prefix}:${entity.id}`)) continue;
      const board = removeEntity(spec.board, entity.id)!;
      mutations.push(result(
        'entity-removal',
        `${prefix}:${entity.id}`,
        mutationEffect(spec, board, baseline, maximumStates),
        spec.theorem.readabilityElements,
      ));
    }
  }

  for (const terrainGoal of spec.board.terrainGoals) {
    const board = {
      ...spec.board,
      terrainGoals: spec.board.terrainGoals.filter((cell) => cellKey(cell) !== cellKey(terrainGoal)),
    };
    mutations.push(result(
      'mechanism-removal',
      `terrain-goal:${cellKey(terrainGoal)}`,
      mutationEffect(spec, board, baseline, maximumStates),
      spec.theorem.readabilityElements,
    ));
  }
  for (const terrainSpike of spec.board.terrainSpikes) {
    const board = {
      ...spec.board,
      terrainSpikes: spec.board.terrainSpikes.filter((cell) => cellKey(cell) !== cellKey(terrainSpike)),
    };
    mutations.push(result(
      'mechanism-removal',
      `terrain-spike:${cellKey(terrainSpike)}`,
      mutationEffect(spec, board, baseline, maximumStates),
      spec.theorem.readabilityElements,
    ));
  }

  const occupied = new Set([
    cellKey(spec.board.player),
    ...spec.board.walls.map(cellKey),
    ...spec.board.terrainGoals.map(cellKey),
    ...spec.board.terrainSpikes.map(cellKey),
    ...spec.board.blocks.flatMap(entityCells).map(cellKey),
    ...spec.board.goals.flatMap(entityCells).map(cellKey),
    ...spec.board.gates.flatMap(entityCells).map(cellKey),
    ...spec.board.spikes.flatMap(entityCells).map(cellKey),
    ...(spec.board.dynamicWalls ?? []).flatMap(entityCells).map(cellKey),
  ]);

  for (let y = 0; y < spec.board.height; y += 1) {
    for (let x = 0; x < spec.board.width; x += 1) {
      const cell = { x, y };
      if (occupied.has(cellKey(cell))) continue;
      const board = { ...spec.board, walls: [...spec.board.walls, cell] };
      mutations.push(result(
        'wall-insertion',
        `cell:${cellKey(cell)}`,
        mutationEffect(spec, board, baseline, maximumStates),
        spec.theorem.readabilityElements,
      ));
    }
  }

  return mutations;
}
