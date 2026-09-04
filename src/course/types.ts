import type { DomainEvent, LevelDefinition } from '../engine/types';

export type TeachingRole =
  | 'establish'
  | 'boundary'
  | 'inference'
  | 'practice'
  | 'transfer'
  | 'synthesis'
  | 'summit';

/** Backwards-compatible vocabulary for the original three-part lesson groups. */
export type LessonRole = Extract<TeachingRole, 'establish' | 'boundary' | 'inference'>;

export type CognitiveStage =
  | 'seed'
  | 'reinforce'
  | 'stress'
  | 'overturn'
  | 'transfer'
  | 'synthesize';

export type DifficultyRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DifficultyAssessment = Readonly<{
  target: DifficultyRating;
  observed?: number;
  /** Author judgment is separate from unfamiliar-player observations and sampleSize. */
  authorRating?: DifficultyRating;
  confidence: 'design-target' | 'author-accepted-foundation' | 'playtest-provisional' | 'calibrated';
  sampleSize: number;
}>;

export type TechniqueUse = Readonly<{
  techniqueId: string;
  role: 'primary' | 'support';
}>;

export type ProofEventKey = `event:${DomainEvent['type']}${string}`;

export type ProofEventPattern = Readonly<{
  key: ProofEventKey;
}>;

export type ProofCondition =
  | Readonly<{ kind: 'event'; event: ProofEventPattern }>
  | Readonly<{ kind: 'count'; event: ProofEventPattern; atLeast: number }>
  | Readonly<{ kind: 'sequence'; events: readonly ProofEventPattern[] }>;

export type LevelTheorem = Readonly<{
  axioms: readonly string[];
  proposition: string;
  proofConditions: readonly ProofCondition[];
  /** Ordered insight checkpoints; the final one anchors tail-push measurement. */
  milestones: readonly ProofCondition[];
  contrastVariable?: string;
  readabilityElements?: readonly string[];
}>;

export type LevelSpec = Readonly<{
  id: string;
  groupId: string;
  role: TeachingRole;
  cognitiveStage: CognitiveStage;
  prerequisites: readonly string[];
  techniques: readonly TechniqueUse[];
  difficulty: DifficultyAssessment;
  board: LevelDefinition;
  theorem: LevelTheorem;
}>;

export type CourseGroupDefinition = Readonly<{
  id: string;
  title: string;
  branch: 'foundation' | 'shape' | 'fake' | 'spike' | 'goal' | 'rain' | 'gate' | 'combination';
  prerequisites: readonly string[];
  /** Stable level ids that must be completed even when their group is not playable yet. */
  requiredLevelIds?: readonly string[];
  completionPrerequisites?: readonly string[];
  /** Explicit when mastery is not represented by the second lesson. */
  masteryLevelId?: string;
  levelIds: readonly string[];
}>;

export type SearchStatus = 'solved' | 'proven-unsolved' | 'budget-exhausted';

export type LevelAnalysis = Readonly<{
  status: SearchStatus;
  solvable: boolean;
  optimalMoves: number;
  optimalPushes: number;
  insightTailPushes: number;
  bypassExists: boolean;
  proofCriticalElements: readonly string[];
}>;

export type CourseCatalogId = 'accepted-foundation-v1' | 'mastery-v2';
export type CourseCatalogStatus = 'active' | 'draft';

export type CourseCompletionDefinition = Readonly<{
  foundationLevelIds: readonly string[];
  mainEndingLevelIds: readonly string[];
  mainEndingRequiredCount: number;
  fullCompletionLevelIds: readonly string[];
}>;

export type CourseActDefinition = Readonly<{
  id: string;
  title: string;
  levelIds: readonly string[];
}>;

/**
 * A catalog owns teaching order. Stable level and entity ids continue to live
 * on the authored level itself, so inserting a lesson never rewrites saves or
 * proof predicates.
 */
export type CourseCatalog = Readonly<{
  id: CourseCatalogId;
  schemaVersion: number;
  status: CourseCatalogStatus;
  title: string;
  targetFormalLevelCount: number;
  /** Complete stable-id order, including planned slots that are not playable yet. */
  formalLevelOrder: readonly string[];
  completion: CourseCompletionDefinition;
  acts: readonly CourseActDefinition[];
  groups: readonly CourseGroupDefinition[];
  levels: readonly LevelSpec[];
  labGroups: readonly CourseGroupDefinition[];
  labLevels: readonly LevelSpec[];
}>;
