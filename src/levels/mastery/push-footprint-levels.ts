import type { LevelSpec } from '../../course/types';
import {
  blockEvent,
  blockTransition,
  eventSequence,
  masteryCell as cell,
  masteryLevel,
  masteryOneCell,
  wallsOutside,
} from './mastery-level-helpers';

const groupId = 'mastery-push-footprint-opening';
const verticalDomino = [cell(0, 0), cell(0, 1)] as const;

const p1Id = 'mastery-push-footprint-01';
const p1Block = `${p1Id}-block`;
const p1Open = [
  cell(1, 1), cell(2, 1), cell(3, 1), cell(4, 1),
  cell(2, 2), cell(3, 2), cell(4, 2),
];

const p2Id = 'mastery-push-footprint-02';
const p2Door = `${p2Id}-door`;
const p2Block = `${p2Id}-block`;
const p2Open = [
  cell(2, 1), cell(3, 1), cell(4, 1), cell(5, 1),
  cell(2, 2), cell(3, 2),
  cell(1, 3), cell(2, 3), cell(3, 3),
];

const p3Id = 'mastery-push-footprint-03';
const p3Door = `${p3Id}-door`;
const p3Block = `${p3Id}-block`;
const p3Open = [
  cell(2, 1), cell(3, 1), cell(4, 1), cell(5, 1),
  cell(2, 2), cell(3, 2), cell(4, 2),
  cell(1, 3), cell(2, 3), cell(3, 3),
];

const p4Id = 'mastery-push-footprint-04';
const p4Door = `${p4Id}-near-shape`;
const p4Block = `${p4Id}-far-shape`;
const p4Open = [
  cell(2, 1), cell(3, 1), cell(4, 1),
  cell(2, 2), cell(3, 2), cell(4, 2), cell(5, 2), cell(6, 2),
  cell(1, 3), cell(2, 3), cell(3, 3), cell(5, 3), cell(6, 3),
];

const p5Id = 'mastery-push-footprint-05';
const p5Support = `${p5Id}-brake`;
const p5Task = `${p5Id}-task`;
const p5Open = [
  cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0), cell(4, 0), cell(5, 0), cell(6, 0),
  cell(3, 1), cell(4, 1), cell(5, 1), cell(6, 1),
  cell(3, 2),
  cell(3, 3),
];

const p6Id = 'mastery-push-footprint-06';
const p6Near = `${p6Id}-near-shape`;
const p6Far = `${p6Id}-far-shape`;
const p6Open = [
  cell(1, 1), cell(2, 1), cell(3, 1),
  cell(1, 2), cell(2, 2), cell(3, 2), cell(4, 2), cell(5, 2), cell(6, 2),
  cell(1, 3), cell(2, 3), cell(3, 3), cell(5, 3), cell(6, 3),
];

export const pushFootprintLevels: readonly LevelSpec[] = [
  masteryLevel({
    id: p1Id,
    groupId,
    title: '回身余地',
    role: 'practice',
    cognitiveStage: 'reinforce',
    targetDifficulty: 3,
    axioms: ['Block 只能推不能拉；推动需要目标方向后的落脚空间。'],
    proposition: '第一推必须暂时远离 Goal，才能取得反向推侧。',
    proofConditions: [eventSequence(
      blockTransition(p1Block, cell(2, 1), cell(3, 1)),
      blockTransition(p1Block, cell(2, 1), cell(1, 1)),
    )],
    milestones: [
      blockTransition(p1Block, cell(2, 1), cell(3, 1)),
      blockTransition(p1Block, cell(2, 1), cell(1, 1)),
    ],
    techniques: [
      { techniqueId: 'push-side-preservation', role: 'primary' },
      { techniqueId: 'temporary-regression', role: 'support' },
    ],
    board: {
      width: 6,
      height: 4,
      weather: 'clear',
      player: cell(1, 1),
      walls: wallsOutside(6, 4, p1Open),
      terrainGoals: [cell(1, 1)],
      terrainSpikes: [],
      blocks: [{ id: p1Block, position: cell(2, 1), shape: masteryOneCell, number: 0, isFake: false }],
      goals: [],
      gates: [],
      spikes: [],
      paths: [],
    },
  }),
  masteryLevel({
    id: p2Id,
    groupId,
    title: '门留下的格子',
    role: 'transfer',
    cognitiveStage: 'transfer',
    targetDifficulty: 3,
    axioms: ['多格物推动时完整 footprint 一起平移；移走后，每个原占位格都会释放。'],
    proposition: '多格物远离玩家的原占位格，是抵达第二个 Block 推侧的唯一通路。',
    proofConditions: [blockEvent(p2Door), blockEvent(p2Block)],
    milestones: [blockEvent(p2Door), blockEvent(p2Block)],
    techniques: [
      { techniqueId: 'remote-footprint-clearance', role: 'primary' },
      { techniqueId: 'push-side-access', role: 'support' },
    ],
    board: {
      width: 7,
      height: 5,
      weather: 'clear',
      player: cell(1, 3),
      walls: wallsOutside(7, 5, p2Open),
      terrainGoals: [cell(3, 2), cell(3, 3), cell(5, 1)],
      terrainSpikes: [],
      blocks: [
        { id: p2Door, position: cell(2, 2), shape: verticalDomino, number: 0, isFake: false },
        { id: p2Block, position: cell(4, 1), shape: masteryOneCell, number: 0, isFake: false },
      ],
      goals: [],
      gates: [],
      spikes: [],
      paths: [],
    },
  }),
  masteryLevel({
    id: p3Id,
    groupId,
    title: '离开终点',
    role: 'inference',
    cognitiveStage: 'stress',
    targetDifficulty: 4,
    axioms: ['已覆盖 Goal 的真实 Block 仍然可以被推动；胜利只检查最终状态。'],
    proposition: '先把已完成的多格物推出 Goal，才能开路；完成另一物件后再将它复原。',
    proofConditions: [eventSequence(
      blockTransition(p3Door, cell(2, 2), cell(3, 2)),
      blockEvent(p3Block),
      blockTransition(p3Door, cell(3, 2), cell(2, 2)),
    )],
    milestones: [
      blockTransition(p3Door, cell(2, 2), cell(3, 2)),
      blockEvent(p3Block),
      blockTransition(p3Door, cell(3, 2), cell(2, 2)),
    ],
    techniques: [
      { techniqueId: 'temporary-regression', role: 'primary' },
      { techniqueId: 'remote-footprint-clearance', role: 'support' },
    ],
    board: {
      width: 7,
      height: 5,
      weather: 'clear',
      player: cell(1, 3),
      walls: wallsOutside(7, 5, p3Open),
      terrainGoals: [cell(2, 2), cell(2, 3), cell(5, 1)],
      terrainSpikes: [],
      blocks: [
        { id: p3Door, position: cell(2, 2), shape: verticalDomino, number: 0, isFake: false },
        { id: p3Block, position: cell(4, 1), shape: masteryOneCell, number: 0, isFake: false },
      ],
      goals: [],
      gates: [],
      spikes: [],
      paths: [],
    },
  }),
  masteryLevel({
    id: p4Id,
    groupId: 'mastery-push-footprint-shared-route',
    title: '共用的绕行线',
    role: 'practice',
    cognitiveStage: 'reinforce',
    targetDifficulty: 4,
    axioms: ['一个多格物改变位置后，会同时开放和封闭多格通路。'],
    proposition: '近端形状必须先让出共用绕行线，并在远端形状处理期间保持可复原的推侧。',
    proofConditions: [
      blockTransition(p4Door, cell(2, 2), cell(3, 2)),
      blockTransition(p4Block, cell(5, 2), cell(6, 2)),
      blockTransition(p4Door, cell(3, 2), cell(2, 2)),
    ],
    milestones: [
      blockTransition(p4Door, cell(2, 2), cell(3, 2)),
      blockTransition(p4Block, cell(5, 2), cell(6, 2)),
      blockTransition(p4Door, cell(3, 2), cell(2, 2)),
    ],
    techniques: [
      { techniqueId: 'shared-circulation-space', role: 'primary' },
      { techniqueId: 'temporary-regression', role: 'support' },
    ],
    board: {
      width: 8,
      height: 5,
      weather: 'clear',
      player: cell(1, 3),
      walls: wallsOutside(8, 5, p4Open),
      terrainGoals: [cell(2, 2), cell(2, 3), cell(6, 2), cell(6, 3)],
      terrainSpikes: [],
      blocks: [
        { id: p4Door, position: cell(2, 2), shape: verticalDomino, number: 0, isFake: false },
        { id: p4Block, position: cell(5, 2), shape: verticalDomino, number: 0, isFake: false },
      ],
      goals: [],
      gates: [],
      spikes: [],
      paths: [],
    },
  }),
  masteryLevel({
    id: p5Id,
    groupId: 'mastery-push-footprint-shared-route',
    title: '临时支点',
    role: 'transfer',
    cognitiveStage: 'transfer',
    targetDifficulty: 5,
    axioms: [
      'Rain 中角色会持续滑到阻挡物前；相邻 Block 仍只被推动一格。',
      '真实 Block 在进入 Goal 前，也可以暂时承担停止物职责。',
    ],
    proposition: '先保留近端真实 Block 作为刹车，才能停在另一形状的推侧；之后再完成这块刹车。',
    proofConditions: [eventSequence(
      'event:rain-slid:from:0,0:to:3,0',
      blockTransition(p5Task, cell(3, 1), cell(3, 2)),
      blockTransition(p5Support, cell(5, 0), cell(6, 0)),
    )],
    milestones: [
      'event:rain-slid:from:0,0:to:3,0',
      blockTransition(p5Task, cell(3, 1), cell(3, 2)),
      blockTransition(p5Support, cell(5, 0), cell(6, 0)),
    ],
    techniques: [
      { techniqueId: 'temporary-block-support', role: 'primary' },
      { techniqueId: 'rain-stop', role: 'support' },
      { techniqueId: 'footprint-push-side', role: 'support' },
    ],
    board: {
      width: 7,
      height: 4,
      weather: 'rain',
      player: cell(0, 0),
      walls: wallsOutside(7, 4, p5Open),
      terrainGoals: [cell(6, 0), cell(6, 1), cell(3, 2), cell(3, 3)],
      terrainSpikes: [],
      blocks: [
        { id: p5Support, position: cell(4, 0), shape: verticalDomino, number: 0, isFake: false },
        { id: p5Task, position: cell(3, 1), shape: verticalDomino, number: 0, isFake: false },
      ],
      goals: [],
      gates: [],
      spikes: [],
      paths: [],
    },
  }),
  masteryLevel({
    id: p6Id,
    groupId: 'mastery-push-footprint-shared-route',
    title: '远处先完成',
    role: 'inference',
    cognitiveStage: 'stress',
    targetDifficulty: 5,
    axioms: ['完成一个 Block 可能永久占去另一物件仍需使用的推侧或通路。'],
    proposition: '近端 Goal 是诱人的错误子目标；必须先绕过近端形状完成远端，再回来完成近端。',
    proofConditions: [eventSequence(
      blockTransition(p6Far, cell(5, 2), cell(6, 2)),
      blockTransition(p6Near, cell(2, 2), cell(3, 2)),
    )],
    milestones: [
      blockTransition(p6Far, cell(5, 2), cell(6, 2)),
      blockTransition(p6Near, cell(2, 2), cell(3, 2)),
    ],
    techniques: [
      { techniqueId: 'far-before-near', role: 'primary' },
      { techniqueId: 'push-side-preservation', role: 'support' },
    ],
    board: {
      width: 8,
      height: 5,
      weather: 'clear',
      player: cell(1, 3),
      walls: wallsOutside(8, 5, p6Open),
      terrainGoals: [cell(3, 2), cell(3, 3), cell(6, 2), cell(6, 3)],
      terrainSpikes: [],
      blocks: [
        { id: p6Near, position: cell(2, 2), shape: verticalDomino, number: 0, isFake: false },
        { id: p6Far, position: cell(5, 2), shape: verticalDomino, number: 0, isFake: false },
      ],
      goals: [],
      gates: [],
      spikes: [],
      paths: [],
    },
  }),
];
