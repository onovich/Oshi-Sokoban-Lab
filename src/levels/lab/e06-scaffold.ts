import type { LevelSpec, ProofCondition } from '../../course/types';

const cell = (x: number, y: number) => ({ x, y });
const id = 'lab-e06-small-court';
const opening: ProofCondition = {
  kind: 'event',
  event: { key: `event:block-pushed:${id}-a:from:2,2:to:1,2` },
};
const sideAccess: ProofCondition = {
  kind: 'sequence',
  events: [
    { key: `event:block-pushed:${id}-a:from:2,2:to:1,2` },
    { key: `event:block-pushed:${id}-c:from:3,1:to:4,1` },
  ],
};

/** Playable learning aid for E06; not a calibrated rating or a formal course slot. */
export const e06Scaffold: LevelSpec = {
  id,
  groupId: 'lab-e06-learning',
  role: 'practice',
  cognitiveStage: 'reinforce',
  prerequisites: ['mastery-push-footprint-03', 'mastery-push-footprint-10'],
  techniques: [
    { techniqueId: 'recoverable-intermediate-state', role: 'primary' },
    { techniqueId: 'push-side-preservation', role: 'support' },
  ],
  difficulty: { target: 3, confidence: 'design-target', sampleSize: 0 },
  board: {
    id,
    title: '短庭',
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖 Goal。',
    width: 5,
    height: 4,
    weather: 'clear',
    player: cell(4, 2),
    walls: [cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0), cell(0, 3), cell(4, 3)],
    terrainGoals: [cell(3, 2), cell(3, 3), cell(4, 0)],
    terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: cell(2, 2), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false },
      { id: `${id}-c`, position: cell(3, 1), shape: [cell(0, 0)], number: 0, isFake: false },
    ],
    goals: [],
    gates: [],
    spikes: [],
    paths: [],
  },
  theorem: {
    axioms: ['普通推动、完整占格与静态 Goal 覆盖规则不变。'],
    proposition: '先把长物暂存到远离目标的位置，取得另一物件的推侧，再从可恢复的布置收尾。',
    // A may partially return before C advances, if the player already has the push side.
    proofConditions: [sideAccess],
    milestones: [opening],
  },
};
