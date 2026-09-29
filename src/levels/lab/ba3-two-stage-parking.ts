import type { LevelSpec } from '../../course/types';

const id = 'lab-ba3-two-stage-parking';
const c = (x: number, y: number) => ({ x, y });
const floor = new Set([
  '3,0', '3,1', '3,2', '3,3', '3,4', '3,5', '3,6', '3,7',
  '2,3', '1,3', '0,3', '2,4', '2,5', '2,6', '2,7',
  '4,3', '5,3', '6,3', '4,4', '5,4', '6,4', '5,2', '6,2', '5,1', '4,1', '4,0',
]);

export const ba3TwoStageParking: LevelSpec = {
  id, groupId: 'batch-a-return', role: 'inference', cognitiveStage: 'transfer',
  prerequisites: ['lab-ba1-return-passage', 'lab-ba2-shared-bay'],
  techniques: [{ techniqueId: 'return-route-reservation', role: 'primary' }],
  difficulty: { target: 6, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '复廊', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 7, height: 8, weather: 'clear', player: c(2, 5),
    walls: Array.from({ length: 56 }, (_, i) => c(i % 7, Math.floor(i / 7)))
      .filter(cell => !floor.has(`${cell.x},${cell.y}`)),
    terrainGoals: [c(3, 1), c(3, 2), c(3, 3), c(0, 3)], terrainSpikes: [],
    blocks: [
      { id: `${id}-a`, position: c(3, 2), shape: [c(0, 0), c(0, 1), c(0, 2)], number: 0, isFake: false },
      { id: `${id}-b`, position: c(5, 3), shape: [c(0, 0)], number: 0, isFake: false },
    ],
    goals: [], gates: [], spikes: [], paths: [],
  },
  theorem: {
    axioms: ['普通推动；刚性形状不可旋转；完整占格；覆盖 Goal 不会锁定 Block。'],
    proposition: '竖条的上停位开放去程却挡住返程；必须撤销它，改用下暂存位送回小块，最后才能恢复竖条。',
    proofConditions: [{ kind: 'sequence', events: [
      { key: `event:block-pushed:${id}-a:from:3,2:to:3,1` },
      { key: `event:block-pushed:${id}-a:from:3,3:to:3,4` },
      { key: `event:block-pushed:${id}-b` },
      { key: `event:block-pushed:${id}-a:from:3,4:to:3,3` },
    ] }],
    milestones: [],
    contrastVariable: '只开放左侧 (1,4)、(1,5) 转弯位，小块可改走下通道；竖条无需撤销上停位。',
    readabilityElements: ['cell:6,2'],
  },
};
