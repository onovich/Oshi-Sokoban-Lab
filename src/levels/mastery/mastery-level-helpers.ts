import { proofConditionFromLegacy } from '../../course/proof-condition';
import type {
  CognitiveStage,
  DifficultyRating,
  LevelSpec,
  TeachingRole,
} from '../../course/types';
import type { Cell, LevelDefinition } from '../../engine/types';

export const masteryCell = (x: number, y: number): Cell => ({ x, y });
export const masteryOneCell = [masteryCell(0, 0)] as const;

export function wallsOutside(
  width: number,
  height: number,
  openCells: readonly Cell[],
): readonly Cell[] {
  const open = new Set(openCells.map((cell) => `${cell.x},${cell.y}`));
  return Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  })).filter((cell) => !open.has(`${cell.x},${cell.y}`));
}

type MasteryLevelInput = Readonly<{
  id: string;
  groupId: string;
  title: string;
  role: TeachingRole;
  cognitiveStage: CognitiveStage;
  targetDifficulty: DifficultyRating;
  proposition: string;
  axioms: readonly string[];
  proofConditions: readonly string[];
  milestones: readonly string[];
  techniques: LevelSpec['techniques'];
  board: Omit<LevelDefinition, 'id' | 'title' | 'description' | 'objective'>;
}>;

export function masteryLevel(input: MasteryLevelInput): LevelSpec {
  return {
    id: input.id,
    groupId: input.groupId,
    role: input.role,
    cognitiveStage: input.cognitiveStage,
    prerequisites: ['lesson-06'],
    techniques: input.techniques,
    difficulty: {
      target: input.targetDifficulty,
      confidence: 'design-target',
      sampleSize: 0,
    },
    board: {
      id: input.id,
      title: input.title,
      description: '观察形状、推侧与通路，再决定第一次推动。',
      objective: '让所有真实 Block 完整覆盖兼容 Goal。',
      ...input.board,
    },
    theorem: {
      axioms: input.axioms,
      proposition: input.proposition,
      proofConditions: input.proofConditions.map(proofConditionFromLegacy),
      milestones: input.milestones.map(proofConditionFromLegacy),
    },
  };
}

export function blockEvent(id: string): string {
  return `event:block-pushed:${id}`;
}

export function blockTransition(
  id: string,
  from: Cell,
  to: Cell,
): string {
  return `${blockEvent(id)}:from:${from.x},${from.y}:to:${to.x},${to.y}`;
}

export function goalCrossEvent(id: string): string {
  return `event:goal-crossed:${id}`;
}

export function eventSequence(...events: readonly string[]): string {
  return `event-sequence:${events.join('>')}`;
}
