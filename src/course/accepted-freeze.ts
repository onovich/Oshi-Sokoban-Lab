import type {
  Cell,
  ShapedEntityDefinition,
} from '../engine/types';
import { proofConditionKey } from './proof-condition';
import type { LevelSpec } from './types';

type JsonValue = null | boolean | number | string | readonly JsonValue[] | {
  readonly [key: string]: JsonValue;
};

export type FreezeViolation = Readonly<{
  id: string;
  kind: 'changed' | 'untracked';
  expected?: string;
  actual: string;
}>;

const compareCell = (left: Cell, right: Cell): number => left.y - right.y || left.x - right.x;
const normalizeCells = (cells: readonly Cell[]): readonly Cell[] =>
  [...cells].sort(compareCell).map(({ x, y }) => ({ x, y }));

function normalizeEntities<T extends ShapedEntityDefinition>(entities: readonly T[]): JsonValue {
  return [...entities]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((entity) => ({
      ...entity,
      position: { ...entity.position },
      shape: normalizeCells(entity.shape),
    })) as JsonValue;
}

/** Pure display copy and course ordering are deliberately absent. */
function normalizedFrozenLevel(spec: LevelSpec): JsonValue {
  const board = spec.board;
  return {
    id: spec.id,
    role: spec.role,
    board: {
      width: board.width,
      height: board.height,
      weather: board.weather,
      player: { ...board.player },
      walls: normalizeCells(board.walls),
      dynamicWalls: normalizeEntities(board.dynamicWalls ?? []),
      terrainGoals: normalizeCells(board.terrainGoals),
      terrainSpikes: normalizeCells(board.terrainSpikes),
      blocks: normalizeEntities(board.blocks),
      goals: normalizeEntities(board.goals),
      gates: normalizeEntities(board.gates),
      spikes: normalizeEntities(board.spikes),
      paths: [...board.paths]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((path) => ({ ...path, nodes: path.nodes.map((node) => ({ ...node })) })),
      stepLimit: board.stepLimit ?? null,
      timeLimitSeconds: board.timeLimitSeconds ?? null,
    },
    theorem: {
      axioms: [...spec.theorem.axioms],
      proposition: spec.theorem.proposition,
      requiredPredicates: spec.theorem.proofConditions.map(proofConditionKey).sort(),
      criticalEvent: spec.theorem.milestones.length === 1
        ? proofConditionKey(spec.theorem.milestones[0]!)
        : spec.theorem.milestones.map(proofConditionKey),
      contrastVariable: spec.theorem.contrastVariable ?? null,
      readabilityElements: [...(spec.theorem.readabilityElements ?? [])].sort(),
    },
  };
}

function stableStringify(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Readonly<Record<string, JsonValue>>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableStringify(record[key]!)}`,
  ).join(',')}}`;
}

/** Deterministic FNV-1a fingerprint; this is a change detector, not a security primitive. */
export function frozenLevelHash(spec: LevelSpec): string {
  const input = stableStringify(normalizedFrozenLevel(spec));
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const ACCEPTED_LEVEL_FREEZE_MANIFEST: Readonly<Record<string, string>> = Object.freeze({
  'lesson-01': '6c252a37',
  'lesson-02': '09a02325',
  'lesson-03': '9ac6f167',
  'lesson-04': 'f0ccf77c',
  'lesson-05': '0c93cd04',
  'lesson-06': '2eff5634',
  'lesson-07': '03533264',
  'lesson-08': '3ca62162',
  'lesson-09': '1f629e62',
  'lesson-10': 'b882b131',
  'lesson-11': '5cfaf889',
  'lesson-12': '94e19f92',
  'lesson-13': '1cde5b80',
  'lesson-14': '0f959ae0',
  'lesson-15': '605bd0a4',
  'lesson-16': 'c30b77e1',
  'lesson-17': '1e25332a',
  'lesson-18': 'f3e3fcfd',
  'lesson-22': '8acc1cdf',
  'lesson-23': '81327d96',
  'lesson-24': '9ac44148',
  'lesson-25': '8223435f',
  'lesson-26': '60df5c9f',
  'lesson-27': '071861cb',
  'lesson-28': 'b230e3d6',
  'lesson-29': '0b21720f',
  'lesson-30': '7120f2d0',
  'lesson-31': 'da4e405f',
  'lesson-32': 'bc45b8cd',
  'lesson-33': '01ab3012',
  'lesson-34': '9a46b540',
  'lesson-35': 'bf24f512',
  'lesson-36': 'bc4f41ed',
  'lesson-37': 'aa173652',
  'lesson-38': '8ac1a43d',
  'lesson-39': '225c2e2f',
  'lesson-40': 'f36c9ccc',
  'lesson-41': 'f4ec9455',
  'lesson-42': '1a9d2372',
  'lesson-43': '0febc586',
  'lesson-44': '0d2902cc',
  'lesson-45': '8fbbb2d3',
  'lesson-46': '5ceed32d',
  'lesson-47': '34e8966f',
  'lesson-48': '5107b964',
  'lesson-49': '902f12ca',
  'lesson-50': '7948d35a',
  'lesson-51': 'f876369a',
  'lesson-52': '930f85e7',
  'lesson-53': '338340c5',
  'lesson-54': '6944a436',
  'lesson-55': '435a159c',
  'lesson-56': '945c2582',
  'lesson-57': 'e2e81224',
  'lesson-58': '7d886b5c',
  'lesson-59': '802bc773',
  'lesson-60': 'a45e7bf5',
  'lesson-61': 'd1cc318b',
  'lesson-62': 'afaed346',
  'lesson-63': 'f81d9e7a',
});

export function auditAcceptedLevelFreeze(levels: readonly LevelSpec[]): readonly FreezeViolation[] {
  return levels.flatMap((level): readonly FreezeViolation[] => {
    const actual = frozenLevelHash(level);
    const expected = ACCEPTED_LEVEL_FREEZE_MANIFEST[level.id];
    if (expected === undefined) return [{ id: level.id, kind: 'untracked', actual }];
    return expected === actual ? [] : [{ id: level.id, kind: 'changed', expected, actual }];
  });
}
