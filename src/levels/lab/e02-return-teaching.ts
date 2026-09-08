import type { LevelSpec, ProofEventPattern } from '../../course/types';

const cell = (x: number, y: number) => ({ x, y });

function push(levelId: string, entity: string, from: string, to: string): ProofEventPattern {
  return { key: `event:block-pushed:${levelId}-${entity}:from:${from}:to:${to}` };
}

const returnDoorId = 'lab-e02-return-door';
const returnDoorSequence = [
  push(returnDoorId, 'c', '2,1', '2,0'),
  push(returnDoorId, 'a', '3,1', '2,1'),
  push(returnDoorId, 'c', '2,0', '1,0'),
  push(returnDoorId, 'c', '1,0', '0,0'),
  push(returnDoorId, 'a', '2,1', '3,1'),
] as const;
const openReturnDoor = push(returnDoorId, 'a', '3,1', '2,1');

/** Small playable precursor for E02's return-position dependency. */
export const e02ReturnDoor: LevelSpec = {
  id: returnDoorId,
  groupId: 'lab-e02-return-position',
  role: 'practice',
  cognitiveStage: 'reinforce',
  prerequisites: ['lab-e02-independent-bay'],
  techniques: [
    { techniqueId: 'return-route-reservation', role: 'primary' },
    { techniqueId: 'recoverable-intermediate-state', role: 'support' },
  ],
  difficulty: { target: 3, authorRating: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id: returnDoorId,
    title: '窄门',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 5,
    height: 4,
    weather: 'clear',
    player: cell(2, 2),
    walls: [cell(4, 0), cell(0, 1), cell(1, 1), cell(4, 1), cell(0, 2), cell(0, 3)],
    terrainGoals: [cell(0, 0), cell(3, 1), cell(3, 2)],
    terrainSpikes: [],
    blocks: [
      {
        id: `${returnDoorId}-a`,
        position: cell(3, 1),
        shape: [cell(0, 0), cell(0, 1)],
        number: 0,
        isFake: false,
      },
      {
        id: `${returnDoorId}-c`,
        position: cell(2, 1),
        shape: [cell(0, 0)],
        number: 0,
        isFake: false,
      },
    ],
    goals: [],
    gates: [],
    spikes: [],
    paths: [],
  },
  theorem: {
    axioms: ['普通推动；刚性形状不可旋转；完整占格参与碰撞与静态 Goal 覆盖。'],
    proposition: '已完成的长物必须暂时让出通路，并在单格物通过后从保留的推侧归位。',
    // Winning puts A back on its original Goals, so requiring this departure
    // also proves the level cannot be solved while treating completion as final.
    proofConditions: [{ kind: 'event', event: openReturnDoor }],
    milestones: [{ kind: 'sequence', events: returnDoorSequence.slice(0, 4) }],
    contrastVariable: '若单格物拥有独立通路，长物无需暂时离开完成位置。',
  },
};

const returnReservationId = 'lab-e02-return-reservation';
const reserveReturnSide = [
  push(returnReservationId, 'a', '3,1', '2,1'),
  push(returnReservationId, 'a', '2,1', '3,1'),
  push(returnReservationId, 'b', '1,3', '1,2'),
] as const;

/** Boundary precursor: one tempting completion consumes A's sole return side. */
export const e02ReturnReservation: LevelSpec = {
  id: returnReservationId,
  groupId: 'lab-e02-return-position',
  role: 'boundary',
  cognitiveStage: 'stress',
  prerequisites: [returnDoorId],
  techniques: [
    { techniqueId: 'return-route-reservation', role: 'primary' },
    { techniqueId: 'delayed-completion', role: 'support' },
  ],
  difficulty: { target: 4, authorRating: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id: returnReservationId,
    title: '近岸',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 5,
    height: 5,
    weather: 'clear',
    player: cell(2, 2),
    walls: [cell(4, 0), cell(0, 1), cell(1, 1), cell(4, 1), cell(3, 4), cell(4, 4)],
    terrainGoals: [cell(0, 0), cell(3, 1), cell(3, 2), cell(1, 2)],
    terrainSpikes: [],
    blocks: [
      {
        id: `${returnReservationId}-a`,
        position: cell(3, 1),
        shape: [cell(0, 0), cell(0, 1)],
        number: 0,
        isFake: false,
      },
      {
        id: `${returnReservationId}-b`,
        position: cell(1, 3),
        shape: [cell(0, 0)],
        number: 0,
        isFake: false,
      },
      {
        id: `${returnReservationId}-c`,
        position: cell(2, 1),
        shape: [cell(0, 0)],
        number: 0,
        isFake: false,
      },
    ],
    goals: [],
    gates: [],
    spikes: [],
    paths: [],
  },
  theorem: {
    axioms: ['普通推动；刚性形状不可旋转；完整占格参与碰撞与静态 Goal 覆盖。'],
    proposition: '近处物件的完成格也是长物唯一的归还推侧，因此必须等长物归位后再占用。',
    proofConditions: [{ kind: 'sequence', events: reserveReturnSide }],
    milestones: [{ kind: 'sequence', events: reserveReturnSide.slice(0, 2) }],
    contrastVariable: '只开放近目标北侧站位；不让任何物件使用该新增格时，提前完成也应可恢复。',
  },
};
