import type { LevelSpec } from '../../course/types';
const c = (x: number, y: number) => ({ x, y });
const id = 'lab-oct-s05';
export const octS05: LevelSpec = {
  id, groupId: 'oct-origin', role: 'transfer', cognitiveStage: 'transfer', prerequisites: ['lab-be1-origin-loan'],
  techniques: [{ techniqueId: 'origin-loan', role: 'primary' }, { techniqueId: 'spike-reset', role: 'primary' }],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '交原', description: '观察两件物品与狭口之间的关系。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 5, height: 5, weather: 'clear', player: c(4, 0),
    walls: [c(0, 0), c(0, 1), c(3, 1), c(0, 2), c(0, 3), c(1, 3), c(0, 4), c(1, 4), c(4, 4)],
    terrainGoals: [c(1, 2), c(2, 2)], terrainSpikes: [c(4, 1)],
    blocks: [
      { id: `${id}-a`, position: c(2, 3), shape: [c(0, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(2, 1), shape: [c(0, 0)], number: 0, isFake: false },
    ], goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Block 按出生占格回位，其他 Block 占用该处时不能回位。'],
    proposition: '两件物品交接出生点与运输推侧，先借用并释放出生点，再让被移开的物品回位。',
    proofConditions: [
      { kind: 'event', event: { key: `event:object-reset:block:${id}-b` } },
      { kind: 'event', event: { key: `event:block-pushed:${id}-a:from:2,2:to:2,1` } },
      { kind: 'sequence', events: [
        { key: `event:object-reset:block:${id}-b` },
        { key: `event:object-reset:block:${id}-a` },
      ] },
    ], milestones: [], contrastVariable: '仅开放 (3,1) 侧口，正常运输可代替出生点借还与回位。',
  },
};
