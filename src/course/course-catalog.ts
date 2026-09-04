import type { LevelDefinition, ShapedEntityDefinition } from '../engine/types';
import {
  courseGroups as candidateGroups,
  courseLevels as candidateLevels,
} from '../levels/course-catalog';
import { pushFootprintLevels } from '../levels/mastery/push-footprint-levels';
import { e01ExperimentLevels } from '../levels/lab/e01-experiment';
import { e06Contrast, e06Prototype } from '../levels/lab/e06-experiment';
import { e06Scaffold } from '../levels/lab/e06-scaffold';
import { e02ExperimentLevels } from '../levels/lab/e02-experiment';
import type { CourseActDefinition, CourseCatalog, CourseGroupDefinition } from './types';
import type { LevelSpec } from './types';
import { MASTERY_V2_BLUEPRINT } from './mastery-blueprint';
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

const e06LearningLevels = [e06Scaffold, e06Contrast, e06Prototype];

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
  {
    id: 'mastery-push-footprint-transfer',
    title: '推侧 × Footprint：迁移与依赖',
    branch: 'shape',
    prerequisites: ['mastery-push-footprint-shared-route'],
    completionPrerequisites: ['mastery-push-footprint-shared-route'],
    masteryLevelId: 'mastery-push-footprint-09',
    levelIds: pushFootprintLevels.slice(6, 9).map((level) => level.id),
  },
  {
    id: 'mastery-push-footprint-sequencer',
    title: '推侧 × Footprint：顺序器',
    branch: 'shape',
    prerequisites: ['mastery-push-footprint-transfer'],
    completionPrerequisites: ['mastery-push-footprint-transfer'],
    masteryLevelId: 'mastery-push-footprint-10',
    levelIds: pushFootprintLevels.slice(9).map((level) => level.id),
  },
];
const masteryBlueprintOrder = new Map(
  MASTERY_V2_BLUEPRINT.slots.map((slot, index) => [slot.levelId, index]),
);

const masteryAcceptedGroups: readonly CourseGroupDefinition[] = acceptedGroups.map((group) =>
  group.id === 'g08-spike-origin'
    ? { ...group, requiredLevelIds: ['mastery-spike-bridge-08'] }
    : group);

function firstBlueprintSlot(group: CourseGroupDefinition): number {
  return Math.min(...group.levelIds.map((levelId) =>
    masteryBlueprintOrder.get(levelId) ?? Number.POSITIVE_INFINITY));
}

const masteryGroups: readonly CourseGroupDefinition[] = [
  ...masteryAcceptedGroups,
  ...pushFootprintGroups,
].sort((left, right) => firstBlueprintSlot(left) - firstBlueprintSlot(right));
const masteryLevelsById = new Map<string, LevelSpec>([
  ...acceptedLevelsById,
  ...pushFootprintLevels.map((level) => [level.id, level] as const),
]);

const masteryActs: readonly CourseActDefinition[] = MASTERY_V2_BLUEPRINT.acts.map((act) => ({
  id: act.id,
  title: act.title,
  levelIds: act.slots
    .map((slot) => slot.levelId)
    .filter((levelId) => masteryLevelsById.has(levelId)),
}));
const masteryIds = masteryActs.flatMap((act) => [...act.levelIds]);
const masteryFormalLevelOrder = MASTERY_V2_BLUEPRINT.slots.map((slot) => slot.levelId);

export const acceptedFoundationCatalog: CourseCatalog = {
  id: 'accepted-foundation-v1',
  schemaVersion: 1,
  status: 'active',
  title: 'Oshi 基础课程',
  targetFormalLevelCount: 60,
  formalLevelOrder: acceptedIds,
  completion: {
    foundationLevelIds: acceptedIds,
    mainEndingLevelIds: [],
    mainEndingRequiredCount: 0,
    fullCompletionLevelIds: acceptedIds,
  },
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
  formalLevelOrder: masteryFormalLevelOrder,
  completion: {
    foundationLevelIds: MASTERY_V2_BLUEPRINT.slots
      .filter((slot) => slot.source === 'frozen' || (slot.targetDifficulty ?? 10) <= 6)
      .map((slot) => slot.levelId),
    mainEndingLevelIds: [
      'mastery-number-fake-06',
      'mastery-goal-rain-06',
      'mastery-gate-topology-06',
      'mastery-spike-origin-06',
      'mastery-three-mechanism-03',
      'mastery-three-mechanism-04',
    ],
    mainEndingRequiredCount: 3,
    fullCompletionLevelIds: masteryFormalLevelOrder,
  },
  acts: masteryActs,
  groups: masteryGroups,
  levels: levelsInOrder(masteryIds, masteryLevelsById),
  labGroups: [...labGroups, {
    id: 'lab-e01-spatial',
    title: '空间实验 E01',
    branch: 'shape',
    prerequisites: [],
    levelIds: e01ExperimentLevels.map((level) => level.id),
  }, {
    id: 'lab-e06-spatial',
    title: '空间学习 E06',
    branch: 'shape',
    prerequisites: [],
    levelIds: e06LearningLevels.map((level) => level.id),
  }, {
    id: 'lab-e02-staging',
    title: '空间实验 E02',
    branch: 'shape',
    prerequisites: [],
    levelIds: e02ExperimentLevels.map((level) => level.id),
  }],
  labLevels: [...labLevels, ...e01ExperimentLevels, ...e06LearningLevels, ...e02ExperimentLevels],
};

export function displayNumberFor(catalog: CourseCatalog, levelId: string): number | undefined {
  const index = catalog.formalLevelOrder.indexOf(levelId);
  return index < 0 ? undefined : index + 1;
}
