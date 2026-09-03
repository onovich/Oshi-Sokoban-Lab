import type { LevelDefinition, ShapedEntityDefinition } from '../engine/types';
import {
  courseGroups as candidateGroups,
  courseLevels as candidateLevels,
} from '../levels/course-catalog';
import { pushFootprintLevels } from '../levels/mastery/push-footprint-levels';
import type { CourseActDefinition, CourseCatalog, CourseGroupDefinition } from './types';
import type { LevelSpec } from './types';
import { rewriteProofCondition } from './proof-condition';

const spikePrototypeIds = new Set(['lesson-19', 'lesson-20', 'lesson-21']);
const spikePrototypeGroupId = 'g07-spike-rebirth';

const acceptedLevelsById = new Map(
  candidateLevels
    .filter((level) => !spikePrototypeIds.has(level.id))
    .map((level) => [level.id, level]),
);

const acceptedGroups = candidateGroups
  .filter((group) => group.id !== spikePrototypeGroupId)
  .map((group) => group.id === 'g08-spike-origin'
    ? {
        ...group,
        prerequisites: ['g01-push-side'],
        completionPrerequisites: undefined,
      }
    : group);

function rewriteEntityId<T extends ShapedEntityDefinition>(
  entity: T,
  previousId: string,
  nextId: string,
): T {
  return {
    ...entity,
    id: entity.id.replace(previousId, nextId),
  };
}

function rewriteBoardId(board: LevelDefinition, nextId: string): LevelDefinition {
  const previousId = board.id;
  const rewrite = (value: string | undefined) => value?.replace(previousId, nextId);
  return {
    ...board,
    id: nextId,
    title: board.title.replace(/^\d+\s+—\s+/, ''),
    blocks: board.blocks.map((entity) => rewriteEntityId(entity, previousId, nextId)),
    goals: board.goals.map((entity) => rewriteEntityId(entity, previousId, nextId)),
    gates: board.gates.map((entity) => ({
      ...rewriteEntityId(entity, previousId, nextId),
      nextGateId: rewrite(entity.nextGateId),
    })),
    spikes: board.spikes.map((entity) => rewriteEntityId(entity, previousId, nextId)),
    dynamicWalls: board.dynamicWalls?.map((entity) => rewriteEntityId(entity, previousId, nextId)),
    paths: board.paths.map((path) => ({
      ...path,
      id: rewrite(path.id)!,
      travelerId: rewrite(path.travelerId)!,
    })),
  };
}

function laboratoryLevel(previousId: string, nextId: string): LevelSpec {
  const source = candidateLevels.find((level) => level.id === previousId);
  if (!source) throw new Error(`Missing Spike laboratory source ${previousId}.`);
  const rewrite = (value: string) => value.replaceAll(previousId, nextId);
  return {
    ...source,
    id: nextId,
    groupId: 'lab-spike-destruction-rebirth',
    prerequisites: [],
    board: rewriteBoardId(source.board, nextId),
    theorem: {
      ...source.theorem,
      proofConditions: source.theorem.proofConditions.map((condition) =>
        rewriteProofCondition(condition, rewrite)),
      milestones: source.theorem.milestones.map((condition) =>
        rewriteProofCondition(condition, rewrite)),
      readabilityElements: source.theorem.readabilityElements?.map(rewrite),
    },
  };
}

const labLevels: readonly LevelSpec[] = [
  laboratoryLevel('lesson-19', 'lab-spike-clear'),
  laboratoryLevel('lesson-20', 'lab-spike-rebirth'),
  laboratoryLevel('lesson-21', 'lab-spike-progress'),
];

const labGroups = [{
  id: 'lab-spike-destruction-rebirth',
  title: 'Spike 销毁与重生实验',
  branch: 'spike' as const,
  prerequisites: [],
  levelIds: labLevels.map((level) => level.id),
}];

const acceptedIds = candidateLevels
  .map((level) => level.id)
  .filter((id) => !spikePrototypeIds.has(id));

function levelsInOrder(
  levelIds: readonly string[],
  levelsById: ReadonlyMap<string, LevelSpec> = acceptedLevelsById,
): readonly LevelSpec[] {
  return levelIds.map((id) => {
    const level = levelsById.get(id);
    if (!level) throw new Error(`Catalog refers to missing accepted level ${id}.`);
    return level;
  });
}

function levelIdsForGroups(
  groupIds: readonly string[],
  groups: readonly CourseGroupDefinition[] = acceptedGroups,
): readonly string[] {
  return groupIds.flatMap((id) => {
    const group = groups.find((candidate) => candidate.id === id);
    if (!group) throw new Error(`Catalog refers to missing accepted group ${id}.`);
    return [...group.levelIds];
  });
}

const pushFootprintGroups: readonly CourseGroupDefinition[] = [
  {
    id: 'mastery-push-footprint-opening',
    title: '推侧 × Footprint：退一步',
    branch: 'shape',
    prerequisites: ['g02-footprint-clearance'],
    masteryLevelId: 'mastery-push-footprint-03',
    levelIds: pushFootprintLevels.slice(0, 3).map((level) => level.id),
  },
  {
    id: 'mastery-push-footprint-shared-route',
    title: '推侧 × Footprint：共用空间',
    branch: 'shape',
    prerequisites: ['mastery-push-footprint-opening'],
    completionPrerequisites: ['mastery-push-footprint-opening'],
    masteryLevelId: 'mastery-push-footprint-06',
    levelIds: pushFootprintLevels.slice(3, 6).map((level) => level.id),
  },
];
const masteryGroups: readonly CourseGroupDefinition[] = [
  ...acceptedGroups,
  ...pushFootprintGroups,
];
const masteryLevelsById = new Map<string, LevelSpec>([
  ...acceptedLevelsById,
  ...pushFootprintLevels.map((level) => [level.id, level] as const),
]);

const masteryActSeeds = [
  {
    id: 'act-1-grammar',
    title: 'I · 语法',
    groupIds: [
      'g01-push-side',
      'g02-footprint-clearance',
      'g03-full-coverage',
      'g04-number-match',
      'g05-goal-allocation',
      'g06-fake-block',
      'g10-movable-goal',
      'g11-goal-mode',
    ],
  },
  {
    id: 'act-2-fluency',
    title: 'II · 熟练',
    groupIds: [
      'mastery-push-footprint-opening',
      'mastery-push-footprint-shared-route',
      'g12-rain-stop',
      'g13-rain-adjacency',
      'g14-gate-direction',
      'g15-gate-remote',
      'g16-gate-topology',
    ],
  },
  {
    id: 'act-3-reinterpretation',
    title: 'III · 反转',
    groupIds: ['g08-spike-origin', 'g09-spike-side'],
  },
  {
    id: 'act-4-synthesis',
    title: 'IV · 综合',
    groupIds: [
      'g17-footprint-spike',
      'g18-goal-rain',
      'g19-rain-gate',
      'g20-number-fake',
      'g21-gate-spike',
    ],
  },
  {
    id: 'act-5-summit',
    title: 'V · 峰顶',
    groupIds: [],
  },
] as const;

const masteryActs: readonly CourseActDefinition[] = masteryActSeeds.map((act) => ({
  id: act.id,
  title: act.title,
  levelIds: levelIdsForGroups(act.groupIds, masteryGroups),
}));
const masteryIds = masteryActs.flatMap((act) => [...act.levelIds]);

export const acceptedFoundationCatalog: CourseCatalog = {
  id: 'accepted-foundation-v1',
  schemaVersion: 1,
  status: 'active',
  title: 'Oshi 基础课程',
  targetFormalLevelCount: 60,
  acts: [{ id: 'foundation', title: '基础课程', levelIds: acceptedIds }],
  groups: acceptedGroups,
  levels: levelsInOrder(acceptedIds),
  labGroups,
  labLevels,
};

export const masteryV2Catalog: CourseCatalog = {
  id: 'mastery-v2',
  schemaVersion: 1,
  status: 'draft',
  title: 'Oshi 大师课程',
  targetFormalLevelCount: 120,
  acts: masteryActs,
  groups: masteryGroups,
  levels: levelsInOrder(masteryIds, masteryLevelsById),
  labGroups,
  labLevels,
};

export function displayNumberFor(catalog: CourseCatalog, levelId: string): number | undefined {
  const index = catalog.levels.findIndex((level) => level.id === levelId);
  return index < 0 ? undefined : index + 1;
}
