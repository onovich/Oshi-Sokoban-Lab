import type { LevelSpec } from '../../course/types';

const id = 'lab-bd1-direction-choice';
const c = (x: number, y: number) => ({ x, y });
const floor = new Set([
  '0,0', '1,0', '2,0', '0,1', '1,1', '2,1', '0,2', '1,2', '2,2',
  '4,1', '5,1', '6,1', '4,2', '5,2', '6,2', '4,3', '6,3',
]);

export const bd1DirectionChoice: LevelSpec = {
  id, groupId: 'batch-d-entry', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lesson-42'],
  techniques: [{ techniqueId: 'gate-entry-direction', role: 'primary' }],
  difficulty: { target: 4, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '双隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 的每一格都覆盖兼容 Goal。',
    width: 7, height: 4, weather: 'clear', player: c(2, 1),
    walls: Array.from({ length: 28 }, (_, i) => c(i % 7, Math.floor(i / 7)))
      .filter(cell => !floor.has(`${cell.x},${cell.y}`)),
    terrainGoals: [c(4, 3)], terrainSpikes: [],
    blocks: [{ id: `${id}-b`, position: c(5, 2), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [],
    gates: [
      { id: `${id}-entry`, position: c(1, 1), shape: [c(0, 0)], nextGateId: `${id}-exit` },
      { id: `${id}-exit`, position: c(5, 1), shape: [c(0, 0)], nextGateId: `${id}-entry` },
    ],
    spikes: [], paths: [],
  },
  theorem: {
    axioms: ['Gate 保持入射方向，从配对出口沿该方向再走一格。'],
    proposition: '箱子转向后需要另一推侧；返回入口选择另一入射方向，而非坚持最近的入口走法。',
    proofConditions: [
      { kind: 'event', event: { key: 'event:gate-traversed:right' } },
      { kind: 'event', event: { key: 'event:gate-traversed:left' } },
    ],
    milestones: [],
    contrastVariable: '仅开放 (5,3) 出口房绕行格后，可不从入口向右穿越也完成任务。',
    readabilityElements: ['cell:0,0', 'cell:1,0', 'cell:2,0', 'cell:0,2', 'cell:1,2', 'cell:2,2', 'cell:6,3'],
  },
};
