import type { LevelSpec } from '../../course/types';

const id = 'lab-ba2-shared-bay';
const c = (x: number, y: number) => ({ x, y });
const floor = new Set([
  '4,1', '4,2', '5,2', '4,3', '5,3', '4,4', '5,4', '3,3', '2,2', '1,2',
  '2,3', '1,3', '2,4', '2,5', '3,5', '4,5', '1,4', '1,5', '0,4', '0,5',
]);

export const ba2SharedBay: LevelSpec = {
  id, groupId: 'batch-a-return', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-ba1-return-passage'],
  techniques: [{ techniqueId: 'return-route-reservation', role: 'primary' }],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '转廊', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 7, height: 7, weather: 'clear', player: c(4, 1),
    walls: Array.from({ length: 49 }, (_, i) => c(i % 7, Math.floor(i / 7)))
      .filter(cell => !floor.has(`${cell.x},${cell.y}`)),
    terrainGoals: [c(4, 3), c(5, 3), c(4, 5)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(4, 2), shape: [c(0, 0), c(1, 0)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(2, 3), shape: [c(0, 0)], number: 0, isFake: false },
    ],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；完整占格；已覆盖目标的 Block 仍可推动。'],
    proposition: '横条暂离完成位置后，小块必须让开回收路线，其目标格先供玩家回推横条，再交给小块完成。',
    proofConditions: [{ kind: 'sequence', events: [
      { key: `event:block-pushed:${id}-a:from:4,3:to:4,4` },
      { key: `event:block-pushed:${id}-b` },
      { key: `event:block-pushed:${id}-a:from:4,4:to:4,3` },
    ] }],
    milestones: [],
    contrastVariable: '仅开放 (3,2) 玩家绕行格后，横条不必离开完成位置，两件任务可直接依次完成。',
  },
};
