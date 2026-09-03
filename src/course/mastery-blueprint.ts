import type { DifficultyRating } from './types';

export type MasterySeriesId = 'P' | 'H' | 'G' | 'I' | 'R' | 'T' | 'S' | 'C' | 'U';
export type MasterySlotState = 'frozen' | 'candidate' | 'planned';

export type MasteryBlueprintSlot = Readonly<{
  displayNumber: number;
  actId: string;
  levelId: string;
  source: 'frozen' | 'new';
  state: MasterySlotState;
  seriesId?: MasterySeriesId;
  seriesOrdinal?: number;
  targetDifficulty?: DifficultyRating;
}>;

export type MasteryBlueprintAct = Readonly<{
  id: string;
  title: string;
  slots: readonly MasteryBlueprintSlot[];
}>;

type SlotDraft = Omit<MasteryBlueprintSlot, 'displayNumber' | 'actId'>;

const seriesDifficulties: Readonly<Record<MasterySeriesId, readonly DifficultyRating[]>> = {
  P: [3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9, 10],
  H: [2, 2, 2, 3, 3, 4, 5, 6],
  G: [3, 4, 4, 5],
  I: [4, 4, 5, 6, 7, 8],
  R: [4, 5, 5, 6, 7, 8],
  T: [5, 6, 6, 7, 8, 8],
  S: [5, 6, 6, 7, 7, 8],
  C: [7, 7, 8, 8, 9, 10],
  U: [8, 9, 9, 9, 10, 10],
};

const seriesPrefixes: Readonly<Record<MasterySeriesId, string>> = {
  P: 'mastery-push-footprint',
  H: 'mastery-spike-bridge',
  G: 'mastery-goal-cognition',
  I: 'mastery-number-fake',
  R: 'mastery-goal-rain',
  T: 'mastery-gate-topology',
  S: 'mastery-spike-origin',
  C: 'mastery-three-mechanism',
  U: 'mastery-summit',
};

function padded(value: number): string {
  return String(value).padStart(2, '0');
}

function frozen(levelNumber: number): SlotDraft {
  return {
    levelId: `lesson-${padded(levelNumber)}`,
    source: 'frozen',
    state: 'frozen',
  };
}

function frozenRange(first: number, last: number): readonly SlotDraft[] {
  return Array.from({ length: last - first + 1 }, (_, index) => frozen(first + index));
}

function addition(seriesId: MasterySeriesId, seriesOrdinal: number): SlotDraft {
  const targetDifficulty = seriesDifficulties[seriesId][seriesOrdinal - 1];
  if (!targetDifficulty) throw new Error(`Missing ${seriesId}${seriesOrdinal} difficulty allocation.`);
  return {
    levelId: `${seriesPrefixes[seriesId]}-${padded(seriesOrdinal)}`,
    source: 'new',
    state: seriesId === 'P' && seriesOrdinal <= 10 ? 'candidate' : 'planned',
    seriesId,
    seriesOrdinal,
    targetDifficulty,
  };
}

function additions(seriesId: MasterySeriesId, first: number, last: number): readonly SlotDraft[] {
  return Array.from({ length: last - first + 1 }, (_, index) => addition(seriesId, first + index));
}

const actDrafts = [
  {
    id: 'act-1-grammar',
    title: 'I · 语法',
    slots: [
      ...frozenRange(1, 3), addition('H', 1),
      ...frozenRange(4, 6), addition('H', 2),
      ...frozenRange(7, 9), addition('G', 1),
      ...frozenRange(10, 12), addition('G', 2),
      ...frozenRange(13, 15), addition('H', 3), addition('G', 3),
      ...frozenRange(16, 18),
      ...frozenRange(28, 30),
      ...frozenRange(31, 33),
    ],
  },
  {
    id: 'act-2-fluency',
    title: 'II · 熟练',
    slots: [
      ...additions('P', 1, 6), addition('H', 4),
      ...frozenRange(34, 36), addition('H', 5),
      ...frozenRange(37, 39), addition('H', 6),
      ...frozenRange(40, 42),
      ...frozenRange(43, 45), addition('H', 7),
      ...frozenRange(46, 48), addition('G', 4),
      ...additions('P', 7, 10),
    ],
  },
  {
    id: 'act-3-reinterpretation',
    title: 'III · 反转',
    slots: [
      ...additions('P', 11, 12),
      ...additions('I', 1, 6),
      addition('H', 8),
      ...frozenRange(22, 27),
      ...additions('S', 1, 6),
      ...additions('R', 1, 6),
      ...additions('T', 1, 2),
    ],
  },
  {
    id: 'act-4-synthesis',
    title: 'IV · 综合',
    slots: [
      ...frozenRange(49, 51), ...additions('T', 3, 4),
      ...frozenRange(52, 54), addition('T', 5),
      ...frozenRange(55, 57), addition('T', 6),
      ...frozenRange(58, 60), ...additions('C', 1, 2),
      ...frozenRange(61, 63), ...additions('C', 3, 5),
    ],
  },
  {
    id: 'act-5-summit',
    title: 'V · 峰顶',
    slots: [addition('C', 6), ...additions('U', 1, 6)],
  },
] as const;

let displayNumber = 0;
const acts: readonly MasteryBlueprintAct[] = actDrafts.map((act) => ({
  id: act.id,
  title: act.title,
  slots: act.slots.map((slot): MasteryBlueprintSlot => ({
    ...slot,
    displayNumber: ++displayNumber,
    actId: act.id,
  })),
}));

export const MASTERY_V2_BLUEPRINT = Object.freeze({
  acts,
  slots: acts.flatMap((act) => act.slots),
});
