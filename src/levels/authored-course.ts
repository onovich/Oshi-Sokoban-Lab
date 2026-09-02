import type { Cell, LevelDefinition } from '../engine/types';
import { mutationPrunedWallsFor } from './course-framing-walls';
import { cell, oneCell } from './families/shared';

export type AuthoredLesson = Readonly<{
  board: LevelDefinition;
  requiredPredicates: readonly string[];
  criticalEvent: string;
  readabilityElements: readonly string[];
}>;

type BoardPatch = Omit<LevelDefinition, 'id' | 'title' | 'description' | 'objective'>;

const lessonId = (number: number): string => `lesson-${String(number).padStart(2, '0')}`;
const entityId = (number: number, name: string): string => `${lessonId(number)}-${name}`;
const blockEvent = (number: number, name = 'block'): string => `event:block-pushed:${entityId(number, name)}`;
const blockTransitionEvent = (
  number: number,
  name: string,
  from: Cell,
  to: Cell,
): string => `${blockEvent(number, name)}:from:${from.x},${from.y}:to:${to.x},${to.y}`;
const goalPushEvent = (number: number, name = 'goal'): string => `event:goal-pushed:${entityId(number, name)}`;
const goalCrossEvent = (number: number, name = 'goal'): string => `event:goal-crossed:${entityId(number, name)}`;
const gatePushEvent = (number: number, name = 'gate-a'): string => `event:gate-pushed:${entityId(number, name)}`;
const gateEntryEvent = (number: number, name = 'gate-a'): string =>
  `event:gate-traversed:entry:${entityId(number, name)}`;
const resetEvent = (number: number, type: 'block' | 'goal' | 'gate', name: string): string =>
  `event:object-reset:${type}:${entityId(number, name)}`;
const eventCount = (count: number, event: string): string => `event-count:${count}:${event}`;
const eventSequence = (...events: readonly string[]): string => `event-sequence:${events.join('>')}`;

function board(number: number, title: string, patch: BoardPatch): LevelDefinition {
  return {
    id: lessonId(number),
    title: `${String(number).padStart(2, '0')} — ${title}`,
    description: '先观察物件、目标与可站立位置，再决定第一步。',
    objective: '让所有真实 Block 完整覆盖兼容 Goal。',
    ...patch,
  };
}

function lesson(
  value: LevelDefinition,
  requiredPredicates: readonly string[],
  criticalEvent = requiredPredicates[0]!,
  readabilityElements: readonly string[] = [],
): AuthoredLesson {
  return { board: value, requiredPredicates, criticalEvent, readabilityElements };
}

function wallsExcept(width: number, height: number, open: readonly Cell[]): readonly Cell[] {
  const key = new Set(open.map((position) => `${position.x}:${position.y}`));
  return Array.from({ length: width * height }, (_, index) => cell(index % width, Math.floor(index / width)))
    .filter((position) => !key.has(`${position.x}:${position.y}`));
}

function standard(
  number: number,
  title: string,
  patch: Partial<BoardPatch> & Pick<BoardPatch, 'width' | 'height' | 'player' | 'blocks'>,
): LevelDefinition {
  const draft: BoardPatch = {
    weather: 'clear', walls: [], terrainGoals: [], terrainSpikes: [], goals: [], gates: [], spikes: [], paths: [],
    ...patch,
  };
  const walls = [...draft.walls, ...mutationPrunedWallsFor(number)].filter(
    (candidate, index, values) => values.findIndex(
      (value) => value.x === candidate.x && value.y === candidate.y,
    ) === index,
  );
  return board(number, title, { ...draft, walls });
}

function pairedGates(number: number, a: Cell, b: Cell) {
  return [
    { id: entityId(number, 'gate-a'), position: a, shape: oneCell, nextGateId: entityId(number, 'gate-b') },
    { id: entityId(number, 'gate-b'), position: b, shape: oneCell, nextGateId: entityId(number, 'gate-a') },
  ] as const;
}

export const authoredCourse: readonly AuthoredLesson[] = [
  // 01–03 · Push-side access
  lesson(standard(1, '推侧访问：开放的一侧', {
    width: 4, height: 1, player: cell(0, 0), terrainGoals: [cell(3, 0)],
    blocks: [{ id: entityId(1, 'block'), position: cell(1, 0), shape: oneCell, number: 0, isFake: false }],
  }), [blockEvent(1)]),
  lesson(standard(2, '推侧访问：先抵达箱后', {
    width: 4, height: 3, player: cell(0, 2), terrainGoals: [cell(3, 1)],
    blocks: [{ id: entityId(2, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false }],
  }), [blockEvent(2)]),
  lesson(standard(3, '推侧访问：两件物体的顺序', {
    width: 5, height: 4, player: cell(0, 3), terrainGoals: [cell(4, 1), cell(4, 2)],
    blocks: [
      { id: entityId(3, 'block-a'), position: cell(1, 1), shape: oneCell, number: 0, isFake: false },
      { id: entityId(3, 'block-b'), position: cell(1, 2), shape: oneCell, number: 0, isFake: false },
    ],
  }), [
    eventCount(3, blockEvent(3, 'block-a')),
    eventCount(3, blockEvent(3, 'block-b')),
  ], blockEvent(3, 'block-a')),

  // 04–06 · Whole-footprint clearance
  lesson(standard(4, '完整 footprint：一起移动', {
    width: 5, height: 4, player: cell(0, 1), terrainGoals: [cell(3, 1), cell(3, 2)],
    blocks: [{ id: entityId(4, 'block'), position: cell(1, 1), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false }],
  }), [blockEvent(4)]),
  lesson(standard(5, '完整 footprint：一格受阻', {
    width: 4, height: 4, player: cell(0, 1), walls: [cell(2, 2)], terrainGoals: [cell(2, 0), cell(2, 1)],
    blocks: [{ id: entityId(5, 'block'), position: cell(1, 1), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false }],
  }), [blockEvent(5)]),
  lesson(standard(6, '完整 footprint：腾出的格子', {
    width: 5, height: 5, player: cell(0, 1), walls: [cell(4, 2)],
    terrainGoals: [cell(3, 2), cell(3, 3), cell(4, 3)],
    blocks: [{ id: entityId(6, 'block'), position: cell(1, 1), shape: [cell(0, 0), cell(0, 1), cell(1, 1)], number: 0, isFake: false }],
  }), [eventCount(3, blockEvent(6))], blockEvent(6)),

  // 07–09 · Full coverage
  lesson(standard(7, '完整覆盖：两格都要到位', {
    width: 5, height: 3, player: cell(0, 0), terrainGoals: [cell(3, 0), cell(3, 1)],
    blocks: [{ id: entityId(7, 'block'), position: cell(1, 0), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false }],
  }), [blockEvent(7)]),
  lesson(standard(8, '完整覆盖：局部重合不算', {
    width: 5, height: 3, player: cell(0, 0), terrainGoals: [cell(2, 0), cell(3, 0), cell(3, 1)],
    blocks: [{ id: entityId(8, 'block'), position: cell(1, 0), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false }],
  }), [blockEvent(8)], blockEvent(8), ['terrain-goal:2,0']),
  lesson(standard(9, '完整覆盖：读完整目标图案', {
    width: 6, height: 4, player: cell(0, 1), walls: [cell(4, 1)],
    terrainGoals: [cell(4, 2), cell(4, 3), cell(5, 3)],
    blocks: [{ id: entityId(9, 'block'), position: cell(1, 1), shape: [cell(0, 0), cell(0, 1), cell(1, 1)], number: 0, isFake: false }],
  }), [eventCount(4, blockEvent(9))], blockEvent(9)),

  // 10–12 · Number matching
  lesson(standard(10, '数字匹配：同号终点', {
    width: 4, height: 1, player: cell(0, 0),
    blocks: [{ id: entityId(10, 'block'), position: cell(1, 0), shape: oneCell, number: 1, isFake: false }],
    goals: [{ id: entityId(10, 'goal'), position: cell(3, 0), shape: oneCell, number: 1, movable: false }],
  }), [blockEvent(10)]),
  lesson(standard(11, '数字匹配：错号与通配', {
    width: 5, height: 1, player: cell(0, 0), terrainGoals: [cell(4, 0)],
    blocks: [{ id: entityId(11, 'block'), position: cell(1, 0), shape: oneCell, number: 1, isFake: false }],
    goals: [{ id: entityId(11, 'wrong-goal'), position: cell(3, 0), shape: oneCell, number: 2, movable: false }],
  }), [blockEvent(11)], blockEvent(11), [`goal:${entityId(11, 'wrong-goal')}`]),
  lesson(standard(12, '数字匹配：形状与身份同时成立', {
    width: 6, height: 3, player: cell(0, 0),
    blocks: [{ id: entityId(12, 'block'), position: cell(1, 0), shape: [cell(0, 0), cell(0, 1)], number: 2, isFake: false }],
    goals: [
      { id: entityId(12, 'wrong-goal'), position: cell(3, 0), shape: [cell(0, 0), cell(0, 1)], number: 1, movable: false },
      { id: entityId(12, 'goal'), position: cell(4, 0), shape: [cell(0, 0), cell(0, 1)], number: 2, movable: false },
    ],
  }), [eventCount(3, blockEvent(12))], blockEvent(12), [`goal:${entityId(12, 'wrong-goal')}`]),

  // 13–15 · Goal allocation
  ...[13, 14, 15].map((number, variant) => lesson(standard(number, [
    '目标分配：各自的泊位', '目标分配：最近不等于合适', '目标分配：保留稀缺选择',
  ][variant]!, {
    width: variant === 2 ? 7 : 6, height: 4, player: cell(0, 3),
    terrainGoals: [variant === 2 ? cell(6, 1) : cell(5, 2)],
    blocks: variant === 2
      ? [
          { id: entityId(number, 'block-a'), position: cell(2, 1), shape: oneCell, number: 1, isFake: false },
          { id: entityId(number, 'block-b'), position: cell(2, 2), shape: oneCell, number: 0, isFake: false },
        ]
      : [
          { id: entityId(number, 'block-a'), position: cell(1 + (variant === 1 ? 1 : 0), 1), shape: oneCell, number: 1, isFake: false },
          { id: entityId(number, 'block-b'), position: cell(1, 2), shape: oneCell, number: 0, isFake: false },
        ],
    goals: [{
      id: entityId(number, 'goal'),
      position: variant === 2 ? cell(6, 2) : cell(5, 1),
      shape: oneCell,
      number: 1,
      movable: false,
    }],
  }), variant === 2
    ? [
        eventCount(5, blockEvent(number, 'block-a')),
        eventCount(5, blockEvent(number, 'block-b')),
      ]
    : [blockEvent(number, 'block-a'), blockEvent(number, 'block-b')],
    variant === 2
      ? blockTransitionEvent(number, 'block-b', cell(6, 2), cell(6, 1))
      : blockEvent(number, 'block-a'))),

  // 16–18 · Fake Block
  ...[16, 17, 18].map((number, variant) => {
    const open = variant === 2
      ? [
          cell(0, 1), cell(1, 1), cell(3, 1),
          cell(0, 2), cell(1, 2), cell(2, 2), cell(3, 2), cell(4, 2), cell(5, 2),
          cell(1, 3), cell(2, 3), cell(3, 3),
        ]
      : [cell(0, 0), cell(0, 1), cell(1, 0), cell(1, 1), cell(1, 2), cell(2, 1), cell(3, 1), cell(4, 1)];
    return lesson(standard(number, ['Fake Block：清出通路', 'Fake Block：占目标也不算', 'Fake Block：把障碍当工具'][variant]!, {
      width: variant === 2 ? 6 : 5, height: variant === 2 ? 4 : 3,
      player: variant === 2 ? cell(0, 2) : cell(0, 1),
      walls: wallsExcept(variant === 2 ? 6 : 5, variant === 2 ? 4 : 3, open),
      terrainGoals: variant === 2
        ? [cell(5, 2)]
        : variant === 1 ? [cell(1, 1), cell(4, 1)] : [cell(4, 1)],
      blocks: variant === 2
        ? [
            { id: entityId(number, 'fake-a'), position: cell(1, 2), shape: oneCell, number: 0, isFake: true },
            { id: entityId(number, 'fake-b'), position: cell(3, 2), shape: oneCell, number: 0, isFake: true },
            { id: entityId(number, 'block'), position: cell(4, 2), shape: oneCell, number: 0, isFake: false },
          ]
        : [
            { id: entityId(number, 'fake'), position: cell(1, 1), shape: oneCell, number: 0, isFake: true },
            { id: entityId(number, 'block'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false },
          ],
    }), variant === 2
      ? [
          eventSequence(
            blockEvent(number, 'fake-a'),
            blockEvent(number, 'fake-b'),
            blockEvent(number),
          ),
        ]
      : [blockEvent(number, 'fake'), blockEvent(number)],
      variant === 2
        ? blockEvent(number, 'fake-a')
        : blockEvent(number, 'fake'),
      variant === 1 ? ['terrain-goal:1,1'] : []);
  }),

  // 19–21 · Spike destruction / respawn framing
  lesson(standard(19, 'Spike：清除', {
    width: 4, height: 3, player: cell(0, 2),
    walls: wallsExcept(4, 3, [
      cell(2, 0), cell(2, 1),
      cell(0, 2), cell(1, 2), cell(2, 2), cell(3, 2),
    ]),
    terrainGoals: [cell(2, 0)], terrainSpikes: [cell(3, 2)],
    blocks: [
      { id: entityId(19, 'fake'), position: cell(1, 2), shape: oneCell, number: 0, isFake: true },
      { id: entityId(19, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false },
    ],
  }), [
    eventSequence(resetEvent(19, 'block', 'fake'), blockEvent(19)),
  ], resetEvent(19, 'block', 'fake')),
  lesson(standard(20, 'Spike：归位', {
    width: 4, height: 3, player: cell(0, 2),
    walls: wallsExcept(4, 3, [
      cell(2, 0), cell(2, 1),
      cell(0, 2), cell(1, 2), cell(2, 2), cell(3, 2),
    ]),
    terrainGoals: [cell(2, 0), cell(1, 2)], terrainSpikes: [cell(3, 2)],
    blocks: [
      { id: entityId(20, 'block-a'), position: cell(1, 2), shape: oneCell, number: 0, isFake: false },
      { id: entityId(20, 'block-b'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false },
    ],
  }), [
    eventSequence(resetEvent(20, 'block', 'block-a'), blockEvent(20, 'block-b')),
  ], resetEvent(20, 'block', 'block-a')),
  lesson(standard(21, 'Spike：留下的进度', {
    width: 5, height: 3, player: cell(1, 2),
    walls: wallsExcept(5, 3, [
      cell(1, 0), cell(3, 0),
      cell(1, 1), cell(3, 1),
      cell(1, 2), cell(2, 2), cell(3, 2), cell(4, 2),
    ]),
    terrainGoals: [cell(1, 0), cell(3, 0)], terrainSpikes: [cell(4, 2)],
    blocks: [
      { id: entityId(21, 'block-a'), position: cell(1, 1), shape: oneCell, number: 0, isFake: false },
      { id: entityId(21, 'fake'), position: cell(2, 2), shape: oneCell, number: 0, isFake: true },
      { id: entityId(21, 'block-b'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false },
    ],
  }), [
    eventSequence(
      blockEvent(21, 'block-a'),
      resetEvent(21, 'block', 'fake'),
      blockEvent(21, 'block-b'),
    ),
  ], resetEvent(21, 'block', 'fake')),

  // 22–24 · Spike origin reset
  lesson(standard(22, 'Spike：另一边', {
    width: 5, height: 1, player: cell(1, 0), terrainGoals: [cell(0, 0)], terrainSpikes: [cell(4, 0)],
    blocks: [{ id: entityId(22, 'block'), position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
  }), [resetEvent(22, 'block', 'block')]),
  lesson(standard(23, 'Spike：空出的起点', {
    width: 5, height: 4, player: cell(2, 3),
    walls: wallsExcept(5, 4, [
      cell(2, 1),
      cell(0, 2), cell(1, 2), cell(2, 2), cell(3, 2), cell(4, 2),
      cell(1, 3), cell(2, 3),
    ]),
    terrainGoals: [cell(0, 2)], terrainSpikes: [cell(2, 1), cell(4, 2)],
    blocks: [{ id: entityId(23, 'block'), position: cell(2, 2), shape: oneCell, number: 0, isFake: false }],
  }), [resetEvent(23, 'block', 'block')], resetEvent(23, 'block', 'block'), ['terrain-spike:2,1']),
  lesson(standard(24, 'Spike：何时归来', {
    width: 7, height: 4, player: cell(1, 1),
    walls: wallsExcept(7, 4, [
      ...Array.from({ length: 7 }, (_, x) => cell(x, 1)),
      cell(1, 2), cell(1, 3), cell(2, 0), cell(2, 2), cell(2, 3), cell(3, 2),
    ]),
    terrainGoals: [cell(0, 1), cell(2, 0)], terrainSpikes: [cell(6, 1)],
    blocks: [
      { id: entityId(24, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false },
      { id: entityId(24, 'block-b'), position: cell(2, 2), shape: oneCell, number: 0, isFake: false },
    ],
  }), [
    eventCount(4, blockEvent(24)),
    resetEvent(24, 'block', 'block'),
    blockEvent(24, 'block-b'),
  ], resetEvent(24, 'block', 'block'), ['cell:3,2']),

  // 25–27 · Spike side switching
  lesson(standard(25, 'Spike：留下的人', {
    width: 6, height: 1, player: cell(1, 0), terrainGoals: [cell(0, 0)], terrainSpikes: [cell(5, 0)],
    blocks: [{ id: entityId(25, 'block'), position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
  }), [resetEvent(25, 'block', 'block')]),
  lesson(standard(26, 'Spike：触发方向', {
    width: 7, height: 1, player: cell(5, 0), terrainGoals: [cell(6, 0)], terrainSpikes: [cell(1, 0)],
    blocks: [{ id: entityId(26, 'block'), position: cell(4, 0), shape: oneCell, number: 0, isFake: false }],
  }), [resetEvent(26, 'block', 'block')]),
  lesson(standard(27, 'Spike：往返', {
    width: 7, height: 1, player: cell(1, 0), terrainGoals: [cell(0, 0)], terrainSpikes: [cell(6, 0)],
    blocks: [{ id: entityId(27, 'block'), position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
  }), [
    resetEvent(27, 'block', 'block'),
    eventSequence(resetEvent(27, 'block', 'block'), blockEvent(27)),
  ], resetEvent(27, 'block', 'block')),

  // 28–30 · Movable Goal
  lesson(standard(28, '可移动 Goal：先移动终点', {
    width: 4, height: 2, player: cell(0, 1), walls: [cell(0, 0)], terrainGoals: [cell(3, 0)],
    blocks: [{ id: entityId(28, 'block'), position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
    goals: [{ id: entityId(28, 'goal'), position: cell(1, 1), shape: oneCell, number: 0, movable: true }],
  }), [goalPushEvent(28)]),
  lesson(standard(29, '可移动 Goal：终点也是通路', {
    width: 5, height: 2, player: cell(0, 1), walls: [cell(0, 0)], terrainGoals: [cell(4, 0)],
    blocks: [{ id: entityId(29, 'block'), position: cell(3, 0), shape: oneCell, number: 0, isFake: false }],
    goals: [{ id: entityId(29, 'goal'), position: cell(1, 1), shape: oneCell, number: 0, movable: true }],
  }), [goalPushEvent(29)]),
  lesson(standard(30, '可移动 Goal：先重排再完成', {
    width: 5, height: 3, player: cell(0, 1), walls: [cell(0, 0), cell(0, 2), cell(1, 2), cell(2, 2)], terrainGoals: [cell(3, 2)],
    blocks: [{ id: entityId(30, 'block'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false }],
    goals: [{ id: entityId(30, 'goal'), position: cell(1, 1), shape: oneCell, number: 0, movable: true }],
  }), [eventSequence(goalPushEvent(30), blockEvent(30))], goalPushEvent(30)),

  // 31–33 · Goal push/cross mode
  lesson(standard(31, 'Goal 模式：被堵后穿过', {
    width: 4, height: 1, player: cell(0, 0), terrainGoals: [cell(3, 0)],
    blocks: [{ id: entityId(31, 'block'), position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
    goals: [{ id: entityId(31, 'goal'), position: cell(1, 0), shape: oneCell, number: 0, movable: true }],
  }), [goalCrossEvent(31)]),
  lesson(standard(32, 'Goal 模式：同一物件两种结果', {
    width: 5, height: 1, player: cell(0, 0), terrainGoals: [cell(4, 0)],
    blocks: [{ id: entityId(32, 'block'), position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
    goals: [{ id: entityId(32, 'goal'), position: cell(1, 0), shape: oneCell, number: 0, movable: true }],
  }), [goalCrossEvent(32)]),
  lesson(standard(33, 'Goal 模式：先推再穿', {
    width: 5, height: 3, player: cell(0, 1), walls: [cell(0, 0), cell(1, 0), cell(0, 2), cell(1, 2), cell(2, 2)], terrainGoals: [cell(3, 2)],
    blocks: [{ id: entityId(33, 'block'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false }],
    goals: [{ id: entityId(33, 'goal'), position: cell(1, 1), shape: oneCell, number: 0, movable: true }],
  }), [eventSequence(goalPushEvent(33), goalCrossEvent(33), blockEvent(33))], goalCrossEvent(33)),

  // 34–36 · Rain stop points
  lesson(standard(34, 'Rain 停点：在墙前停下', {
    width: 4, height: 3, weather: 'rain', player: cell(0, 0), walls: [cell(3, 0)], terrainGoals: [cell(2, 2)],
    blocks: [{ id: entityId(34, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false }],
  }), ['event:rain-slid']),
  lesson(standard(35, 'Rain 停点：同一路径的新落点', {
    width: 5, height: 3, weather: 'rain', player: cell(4, 0), walls: [cell(1, 0)], terrainGoals: [cell(2, 2)],
    blocks: [{ id: entityId(35, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false }],
  }), ['event:rain-slid']),
  lesson(standard(36, 'Rain 停点：连续规划两次停止', {
    width: 5, height: 5, weather: 'rain', player: cell(0, 0), walls: [cell(4, 0)], terrainGoals: [cell(3, 4)],
    blocks: [{ id: entityId(36, 'block'), position: cell(3, 3), shape: oneCell, number: 0, isFake: false }],
  }), [
    eventCount(2, 'event:rain-slid'),
    eventSequence('event:rain-slid:right', 'event:rain-slid:down', blockEvent(36)),
  ], 'event:rain-slid:down'),

  // 37–39 · Rain adjacency priority
  lesson(standard(37, 'Rain 邻接：先推一步', {
    width: 5, height: 3, weather: 'rain', player: cell(1, 1), walls: [cell(4, 2)], terrainGoals: [cell(0, 1)],
    blocks: [{ id: entityId(37, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false }],
  }), [blockEvent(37), 'event:rain-slid'], 'event:rain-slid'),
  lesson(standard(38, 'Rain 邻接：移开后恢复滑行', {
    width: 5, height: 3, weather: 'rain', player: cell(3, 1), walls: [cell(0, 2)], terrainGoals: [cell(4, 1)],
    blocks: [{ id: entityId(38, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false }],
  }), [blockEvent(38), 'event:rain-slid'], 'event:rain-slid'),
  lesson(standard(39, 'Rain 邻接：切换输入尺度', {
    width: 7, height: 3, weather: 'rain', player: cell(1, 1), walls: [cell(6, 2)], terrainGoals: [cell(0, 1)],
    blocks: [{ id: entityId(39, 'block'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false }],
  }), [
    'event:rain-slid',
    eventCount(3, blockEvent(39)),
    eventSequence('event:rain-slid', blockEvent(39)),
  ], 'event:rain-slid'),

  // 40–42 · Gate direction
  lesson(standard(40, 'Gate 方向：沿入射方向离开', {
    width: 5, height: 3, player: cell(0, 1), walls: [cell(0, 0), cell(0, 2)], terrainGoals: [cell(2, 1)],
    blocks: [{ id: entityId(40, 'block'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(40, cell(1, 1), cell(3, 0)),
  }), ['event:gate-traversed']),
  lesson(standard(41, 'Gate 方向：纵向入射', {
    width: 3, height: 5, player: cell(1, 4), terrainGoals: [cell(2, 0)],
    blocks: [{ id: entityId(41, 'block'), position: cell(1, 0), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(41, cell(1, 3), cell(0, 1)),
  }), ['event:gate-traversed']),
  lesson(standard(42, 'Gate 方向：携带远端推侧', {
    width: 6, height: 4, player: cell(0, 2), walls: [cell(1, 0), cell(1, 1), cell(1, 3)], terrainGoals: [cell(2, 2)],
    blocks: [{ id: entityId(42, 'block'), position: cell(4, 2), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(42, cell(1, 2), cell(4, 1)),
  }), [
    eventCount(2, blockEvent(42)),
    eventSequence(
      `event:gate-traversed:entry:${entityId(42, 'gate-a')}`,
      blockEvent(42),
    ),
  ], `event:gate-traversed:entry:${entityId(42, 'gate-a')}`),

  // 43–45 · Gate remote condition
  lesson(standard(43, 'Gate 远端：出口畅通', {
    width: 5, height: 3, player: cell(0, 1), walls: [cell(0, 0), cell(0, 2)], terrainGoals: [cell(2, 1)],
    blocks: [{ id: entityId(43, 'block'), position: cell(3, 1), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(43, cell(1, 1), cell(3, 0)),
  }), ['event:gate-traversed']),
  lesson(standard(44, 'Gate 远端：出口受阻', {
    width: 5, height: 3, player: cell(0, 1), walls: [cell(0, 0), cell(0, 2), cell(4, 0)], terrainGoals: [cell(3, 2)],
    blocks: [{ id: entityId(44, 'block'), position: cell(2, 2), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(44, cell(1, 1), cell(3, 0)),
  }), [gatePushEvent(44)]),
  lesson(standard(45, 'Gate 远端：主动切换模式', {
    width: 9, height: 4, player: cell(1, 2),
    walls: wallsExcept(9, 4, [
      cell(7, 0),
      cell(2, 1), cell(3, 1), cell(6, 1), cell(7, 1),
      cell(1, 2), cell(2, 2), cell(3, 2), cell(6, 2), cell(7, 2),
      cell(1, 3), cell(2, 3), cell(3, 3), cell(6, 3), cell(7, 3),
    ]),
    terrainGoals: [cell(7, 0), cell(1, 3)],
    blocks: [
      { id: entityId(45, 'block-a'), position: cell(7, 2), shape: oneCell, number: 0, isFake: false },
      { id: entityId(45, 'block-b'), position: cell(2, 3), shape: oneCell, number: 0, isFake: false },
    ],
    gates: pairedGates(45, cell(2, 2), cell(6, 2)),
  }), [
    eventCount(2, blockEvent(45, 'block-a')),
    eventSequence(
      gatePushEvent(45),
      gateEntryEvent(45, 'gate-a'),
      blockEvent(45, 'block-a'),
      gateEntryEvent(45, 'gate-b'),
      blockEvent(45, 'block-b'),
    ),
  ], gateEntryEvent(45, 'gate-b')),

  // 46–48 · Gate topology rewriting
  lesson(standard(46, 'Gate 拓扑：移动入口', {
    width: 5, height: 3, player: cell(0, 1),
    walls: wallsExcept(5, 3, [
      cell(3, 0),
      cell(0, 1), cell(1, 1), cell(2, 1),
      cell(1, 2), cell(2, 2), cell(3, 2),
    ]),
    terrainGoals: [cell(3, 2)],
    blocks: [{ id: entityId(46, 'block'), position: cell(2, 2), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(46, cell(1, 1), cell(3, 0)),
  }), [gatePushEvent(46)]),
  lesson(standard(47, 'Gate 拓扑：配对仍保持', {
    width: 7, height: 4, player: cell(1, 2),
    walls: wallsExcept(7, 4, [
      cell(2, 1), cell(3, 1),
      cell(1, 2), cell(2, 2), cell(3, 2), cell(5, 2),
      cell(3, 3), cell(4, 3), cell(5, 3),
    ]),
    terrainGoals: [cell(3, 3)],
    blocks: [{ id: entityId(47, 'block'), position: cell(4, 3), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(47, cell(2, 2), cell(5, 2)),
  }), [
    eventSequence(gatePushEvent(47), gateEntryEvent(47), blockEvent(47)),
  ], gateEntryEvent(47)),
  lesson(standard(48, 'Gate 拓扑：重写可达区域', {
    width: 8, height: 5, player: cell(1, 2),
    walls: wallsExcept(8, 5, [
      cell(2, 1), cell(3, 1), cell(5, 1), cell(6, 1),
      cell(1, 2), cell(2, 2), cell(3, 2), cell(5, 2), cell(6, 2),
      cell(1, 3), cell(2, 3), cell(3, 3), cell(5, 3), cell(6, 3),
    ]),
    terrainGoals: [cell(1, 3)],
    blocks: [{ id: entityId(48, 'block'), position: cell(2, 3), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(48, cell(2, 2), cell(6, 2)),
  }), [
    eventSequence(
      gatePushEvent(48),
      gateEntryEvent(48, 'gate-a'),
      gateEntryEvent(48, 'gate-b'),
      blockEvent(48),
    ),
  ], gateEntryEvent(48, 'gate-b')),

  // 49–51 · Footprint × Spike
  lesson(standard(49, 'Footprint × Spike：任一格触发', {
    width: 5, height: 2, player: cell(0, 0), terrainGoals: [cell(0, 0), cell(0, 1)], terrainSpikes: [cell(4, 1)],
    blocks: [{ id: entityId(49, 'block'), position: cell(1, 0), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false }],
  }), [resetEvent(49, 'block', 'block')]),
  lesson(standard(50, 'Footprint × Spike：检查完整原位', {
    width: 6, height: 1, player: cell(0, 0), terrainGoals: [cell(0, 0), cell(1, 0)], terrainSpikes: [cell(5, 0)],
    blocks: [{ id: entityId(50, 'block'), position: cell(1, 0), shape: [cell(0, 0), cell(1, 0)], number: 0, isFake: false }],
  }), [resetEvent(50, 'block', 'block')]),
  lesson(standard(51, 'Footprint × Spike：远端格作触发器', {
    width: 6, height: 2, player: cell(0, 0), terrainGoals: [cell(0, 0), cell(0, 1)], terrainSpikes: [cell(5, 1)],
    blocks: [{ id: entityId(51, 'block'), position: cell(1, 0), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false }],
  }), [
    resetEvent(51, 'block', 'block'),
    eventSequence(resetEvent(51, 'block', 'block'), blockEvent(51)),
  ], resetEvent(51, 'block', 'block')),

  // 52–54 · Goal × Rain
  ...[52, 53, 54].map((number, variant) => lesson(standard(number, [
    'Goal × Rain：先移动刹车', 'Goal × Rain：目标也改写停点', 'Goal × Rain：先作地形再作终点',
  ][variant]!, {
    width: variant === 2 ? 6 : 6 + variant, height: 4, weather: 'rain',
    player: variant === 2 ? cell(0, 1) : cell(1, 2),
    walls: variant === 2 ? [cell(0, 2), cell(4, 3)] : [
      cell(2, 0), cell(5 + variant, 1),
      cell(0, 2), cell(2, 2), cell(0, 3), cell(2, 3),
    ],
    terrainGoals: variant === 2 ? [] : [cell(4 + variant, 3)],
    blocks: [{
      id: entityId(number, 'block'),
      position: variant === 2 ? cell(3, 2) : cell(4 + variant, 2),
      shape: oneCell,
      number: 0,
      isFake: false,
    }],
    goals: [{
      id: entityId(number, 'goal'),
      position: variant === 2 ? cell(3, 1) : cell(1, 1),
      shape: oneCell,
      number: 0,
      movable: true,
    }],
  }), variant === 2
    ? [eventSequence(
        'event:rain-slid:from:0,1:to:2,1',
        blockTransitionEvent(number, 'block', cell(3, 2), cell(3, 1)),
      )]
    : [goalPushEvent(number), 'event:rain-slid'],
    variant === 2 ? 'event:rain-slid:from:0,1:to:2,1' : 'event:rain-slid')),

  // 55–57 · Rain × Gate
  lesson(standard(55, 'Rain × Gate：滑入入口', {
    width: 7, height: 3, weather: 'rain', player: cell(0, 1), terrainGoals: [cell(5, 2)],
    blocks: [{ id: entityId(55, 'block'), position: cell(5, 1), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(55, cell(3, 1), cell(4, 0)),
  }), ['event:rain-slid', 'event:gate-traversed'], 'event:gate-traversed'),
  lesson(standard(56, 'Rain × Gate：受阻后停在门前', {
    width: 7, height: 4, weather: 'rain', player: cell(0, 1), walls: [cell(5, 0)], terrainGoals: [cell(3, 3)],
    blocks: [{ id: entityId(56, 'block'), position: cell(3, 2), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(56, cell(3, 1), cell(4, 0)),
  }), ['event:rain-slid', gatePushEvent(56)], gatePushEvent(56)),
  lesson(standard(57, 'Rain × Gate：把轨迹切成推动', {
    width: 8, height: 4, weather: 'rain', player: cell(0, 1), walls: [cell(6, 0)], terrainGoals: [cell(4, 3)],
    blocks: [{ id: entityId(57, 'block'), position: cell(4, 2), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(57, cell(4, 1), cell(5, 0)),
  }), [eventSequence('event:rain-slid', gatePushEvent(57), blockEvent(57))], gatePushEvent(57)),

  // 58–60 · Number × Fake
  ...[58, 59, 60].map((number, variant) => {
    const open = variant === 2
      ? [
          cell(0, 1), cell(1, 1), cell(3, 1),
          cell(0, 2), cell(1, 2), cell(2, 2), cell(3, 2), cell(4, 2), cell(5, 2),
          cell(1, 3), cell(2, 3), cell(3, 3),
        ]
      : [cell(0, 0), cell(0, 1), cell(1, 0), cell(1, 1), cell(1, 2), cell(2, 1), cell(3, 1), cell(4, 1)];
    return lesson(standard(number, ['Number × Fake：同号也不是任务', 'Number × Fake：兼容与身份分离', 'Number × Fake：家具与稀缺目标'][variant]!, {
      width: variant === 2 ? 6 : 5, height: variant === 2 ? 4 : 3,
      player: variant === 2 ? cell(0, 2) : cell(0, 1),
      walls: wallsExcept(variant === 2 ? 6 : 5, variant === 2 ? 4 : 3, open),
      blocks: variant === 2
        ? [
            { id: entityId(number, 'fake-a'), position: cell(1, 2), shape: oneCell, number: 1, isFake: true },
            { id: entityId(number, 'fake-b'), position: cell(3, 2), shape: oneCell, number: 1, isFake: true },
            { id: entityId(number, 'block'), position: cell(4, 2), shape: oneCell, number: 1, isFake: false },
          ]
        : [
            { id: entityId(number, 'fake'), position: cell(1, 1), shape: oneCell, number: 1, isFake: true },
            { id: entityId(number, 'block'), position: cell(3, 1), shape: oneCell, number: 1, isFake: false },
          ],
      goals: [{
        id: entityId(number, 'goal'),
        position: variant === 2 ? cell(5, 2) : cell(4, 1),
        shape: oneCell,
        number: 1,
        movable: false,
      }],
    }), variant === 2
      ? [eventSequence(
          blockEvent(number, 'fake-a'),
          blockEvent(number, 'fake-b'),
          blockEvent(number),
        )]
      : [blockEvent(number, 'fake'), blockEvent(number)],
      blockEvent(number, variant === 2 ? 'fake-a' : 'fake'));
  }),

  // 61–63 · Gate × Spike
  lesson(standard(61, 'Gate × Spike：端点回原位', {
    width: 5, height: 3, player: cell(0, 0),
    walls: wallsExcept(5, 3, [
      cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0), cell(4, 0),
      cell(2, 1), cell(2, 2),
    ]),
    terrainGoals: [cell(2, 2)], terrainSpikes: [cell(3, 0)],
    blocks: [{ id: entityId(61, 'block'), position: cell(2, 1), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(61, cell(1, 0), cell(4, 0)),
  }), [resetEvent(61, 'gate', 'gate-a')]),
  lesson(standard(62, 'Gate × Spike：配对不会解除', {
    width: 7, height: 3, player: cell(0, 0),
    walls: wallsExcept(7, 3, [
      cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0), cell(4, 0), cell(5, 0),
      cell(4, 1), cell(4, 2),
    ]),
    terrainGoals: [cell(4, 2)], terrainSpikes: [cell(3, 0)],
    blocks: [{ id: entityId(62, 'block'), position: cell(4, 1), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(62, cell(1, 0), cell(5, 0)),
  }), [
    eventSequence(
      resetEvent(62, 'gate', 'gate-a'),
      gateEntryEvent(62, 'gate-a'),
      blockEvent(62),
    ),
  ], gateEntryEvent(62, 'gate-a')),
  lesson(standard(63, 'Gate × Spike：拓扑循环', {
    width: 8, height: 4, player: cell(1, 2),
    walls: wallsExcept(8, 4, [
      cell(6, 0),
      cell(4, 1), cell(5, 1), cell(6, 1),
      cell(1, 2), cell(2, 2), cell(3, 2), cell(4, 2), cell(5, 2), cell(6, 2),
      cell(5, 3), cell(6, 3),
    ]),
    terrainGoals: [cell(4, 1)], terrainSpikes: [cell(4, 2), cell(6, 0)],
    blocks: [{ id: entityId(63, 'block'), position: cell(5, 1), shape: oneCell, number: 0, isFake: false }],
    gates: pairedGates(63, cell(2, 2), cell(6, 2)),
  }), [
    eventSequence(
      resetEvent(63, 'gate', 'gate-a'),
      gateEntryEvent(63, 'gate-a'),
      resetEvent(63, 'gate', 'gate-b'),
      blockEvent(63),
    ),
  ], resetEvent(63, 'gate', 'gate-b')),
];
