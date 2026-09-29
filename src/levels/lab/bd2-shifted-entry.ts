import type { LevelSpec } from '../../course/types';

const id = 'lab-bd2-shifted-entry';
const c = (x: number, y: number) => ({ x, y });
const floor = new Set([
  '1,0', '2,0', '1,1', '2,1', '0,2', '1,2', '2,2', '0,3', '1,3', '2,3',
  '4,1', '5,1', '6,1', '4,2', '5,2', '6,2', '4,3',
]);

export const bd2ShiftedEntry: LevelSpec = {
  id, groupId: 'batch-d-entry', role: 'transfer', cognitiveStage: 'transfer',
  prerequisites: ['lab-bd1-direction-choice', 'lesson-44'],
  techniques: [
    { techniqueId: 'gate-entry-direction', role: 'primary' },
    { techniqueId: 'gate-remote-pushability', role: 'support' },
  ],
  difficulty: { target: 5, confidence: 'design-target', sampleSize: 0 },
  board: {
    id, title: '转隙', description: '先观察物件、目标与可站立位置，再决定第一步。',
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
    axioms: ['Gate 出口沿入射方向落一格；远端受阻时才尝试推动入口。'],
    proposition: '利用任务物对出口的初始阻挡，先把入口移至可取得所需入射方向的位置，再完成远端任务。',
    proofConditions: [{ kind: 'event', event: { key: `event:gate-pushed:${id}-entry` } }],
    milestones: [],
    contrastVariable: '只开放入口左侧 (0,1)，无需移动入口也可取得向右入射方向。',
  },
};
