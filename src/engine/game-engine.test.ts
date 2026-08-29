import { describe, expect, it } from 'vitest';

import { createGame, move, restart, tick, undo } from './game-engine';
import type { LevelDefinition } from './types';

const basicLevel: LevelDefinition = {
  id: 'basic',
  title: 'Basic push',
  width: 5,
  height: 3,
  weather: 'clear',
  player: { x: 1, y: 1 },
  walls: [],
  terrainGoals: [{ x: 3, y: 1 }],
  terrainSpikes: [],
  blocks: [
    {
      id: 'block-a',
      position: { x: 2, y: 1 },
      shape: [{ x: 0, y: 0 }],
      number: 0,
      isFake: false,
    },
  ],
  goals: [],
  gates: [],
  spikes: [],
  paths: [],
};

describe('game engine', () => {
  it('pushes a block onto a terrain goal and wins after the environment turn', () => {
    const state = move(createGame(basicLevel), 'right').state;

    expect(state.player).toEqual({ x: 2, y: 1 });
    expect(state.blocks[0]?.position).toEqual({ x: 3, y: 1 });
    expect(state.status).toBe('won');
    expect(state.moves).toBe(1);
  });

  it('uses every cell of a numbered block, while ignoring fake blocks for victory', () => {
    const state = move(
      createGame({
        ...basicLevel,
        width: 6,
        player: { x: 0, y: 1 },
        terrainGoals: [],
        blocks: [
          {
            id: 'real-domino',
            position: { x: 1, y: 1 },
            shape: [
              { x: 0, y: 0 },
              { x: 0, y: 1 },
            ],
            number: 7,
            isFake: false,
          },
          {
            id: 'fake-block',
            position: { x: 4, y: 0 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: true,
          },
        ],
        goals: [
          {
            id: 'goal-seven',
            position: { x: 2, y: 1 },
            shape: [
              { x: 0, y: 0 },
              { x: 0, y: 1 },
            ],
            number: 7,
            movable: false,
          },
        ],
      }),
      'right',
    ).state;

    expect(state.blocks[0]?.position).toEqual({ x: 2, y: 1 });
    expect(state.status).toBe('won');
  });

  it('refuses a multi-cell push when any destination cell is blocked', () => {
    const state = move(
      createGame({
        ...basicLevel,
        width: 6,
        player: { x: 0, y: 1 },
        walls: [{ x: 2, y: 2 }],
        terrainGoals: [],
        blocks: [
          {
            id: 'vertical-block',
            position: { x: 1, y: 1 },
            shape: [
              { x: 0, y: 0 },
              { x: 0, y: 1 },
            ],
            number: 0,
            isFake: false,
          },
        ],
      }),
      'right',
    );

    expect(state.didMove).toBe(false);
    expect(state.state.player).toEqual({ x: 0, y: 1 });
    expect(state.state.blocks[0]?.position).toEqual({ x: 1, y: 1 });
  });

  it('treats shaped dynamic walls as hard terrain alongside painted wall cells', () => {
    const state = move(
      createGame({
        ...basicLevel,
        player: { x: 0, y: 1 },
        walls: [],
        dynamicWalls: [
          {
            id: 'wall-l',
            position: { x: 2, y: 1 },
            shape: [
              { x: 0, y: 0 },
              { x: 0, y: 1 },
            ],
          },
        ],
        terrainGoals: [],
        blocks: [
          {
            id: 'vertical-block',
            position: { x: 1, y: 1 },
            shape: [
              { x: 0, y: 0 },
              { x: 0, y: 1 },
            ],
            number: 0,
            isFake: false,
          },
        ],
      }),
      'right',
    );

    expect(state.didMove).toBe(false);
    expect(state.state.blocks[0]?.position).toEqual({ x: 1, y: 1 });
  });

  it('makes the player slide to the last open cell in rain, but keeps pushes to one cell', () => {
    const slidingState = move(
      createGame({
        ...basicLevel,
        weather: 'rain',
        player: { x: 0, y: 1 },
        walls: [{ x: 4, y: 1 }],
        blocks: [],
      }),
      'right',
    ).state;
    const pushingState = move(
      createGame({
        ...basicLevel,
        weather: 'rain',
        player: { x: 0, y: 1 },
        blocks: [
          {
            id: 'rain-block',
            position: { x: 1, y: 1 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
      }),
      'right',
    ).state;

    expect(slidingState.player).toEqual({ x: 3, y: 1 });
    expect(pushingState.player).toEqual({ x: 1, y: 1 });
    expect(pushingState.blocks[0]?.position).toEqual({ x: 2, y: 1 });
  });

  it('pushes a movable goal as a first-class grid object', () => {
    const state = move(
      createGame({
        ...basicLevel,
        player: { x: 0, y: 1 },
        terrainGoals: [],
        blocks: [
          {
            id: 'unresolved-block',
            position: { x: 4, y: 0 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
        goals: [
          {
            id: 'movable-goal',
            position: { x: 1, y: 1 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            movable: true,
          },
        ],
      }),
      'right',
    ).state;

    expect(state.player).toEqual({ x: 1, y: 1 });
    expect(state.goals[0]?.position).toEqual({ x: 2, y: 1 });
  });

  it('teleports through an unblocked linked gate, and pushes the entrance when its exit is blocked', () => {
    const teleported = move(
      createGame({
        ...basicLevel,
        width: 6,
        player: { x: 0, y: 1 },
        blocks: [],
        gates: [
          {
            id: 'entry',
            position: { x: 1, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'exit',
          },
          {
            id: 'exit',
            position: { x: 4, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'entry',
          },
        ],
      }),
      'right',
    ).state;
    const pushed = move(
      createGame({
        ...basicLevel,
        width: 6,
        player: { x: 0, y: 1 },
        walls: [{ x: 5, y: 1 }],
        blocks: [],
        gates: [
          {
            id: 'entry',
            position: { x: 1, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'exit',
          },
          {
            id: 'exit',
            position: { x: 4, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'entry',
          },
        ],
      }),
      'right',
    ).state;

    expect(teleported.player).toEqual({ x: 5, y: 1 });
    expect(pushed.player).toEqual({ x: 1, y: 1 });
    expect(pushed.gates.find((gate) => gate.id === 'entry')?.position).toEqual({ x: 2, y: 1 });
  });

  it('reports the exact Gate route when the final displacement is diagonal', () => {
    const result = move(
      createGame({
        ...basicLevel,
        width: 5,
        height: 3,
        player: { x: 3, y: 1 },
        blocks: [],
        gates: [
          {
            id: 'blue-gate',
            position: { x: 2, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'orange-gate',
          },
          {
            id: 'orange-gate',
            position: { x: 3, y: 0 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'blue-gate',
          },
        ],
      }),
      'up',
    );

    expect(result.state.player).toEqual({ x: 2, y: 0 });
    expect(result.gateTraversal).toEqual({
      direction: 'up',
      from: { x: 3, y: 1 },
      entry: { x: 3, y: 0 },
      exit: { x: 2, y: 1 },
      to: { x: 2, y: 0 },
    });
  });

  it('lets a linked Gate exit back onto the role departure cell and still consumes the move', () => {
    const result = move(
      createGame({
        ...basicLevel,
        width: 6,
        player: { x: 4, y: 1 },
        terrainGoals: [],
        blocks: [
          {
            id: 'unresolved-block',
            position: { x: 0, y: 0 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
        gates: [
          {
            id: 'entry',
            position: { x: 3, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'exit',
          },
          {
            id: 'exit',
            position: { x: 5, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'entry',
          },
        ],
      }),
      'left',
    );

    expect(result.didMove).toBe(true);
    expect(result.state.player).toEqual({ x: 4, y: 1 });
    expect(result.state.gates.find((gate) => gate.id === 'entry')?.position).toEqual({ x: 3, y: 1 });
    expect(result.state.moves).toBe(1);
  });

  it('resolves reset hazards before moving path spikes and restores every logical field on undo', () => {
    const initial = createGame({
      ...basicLevel,
      width: 6,
      player: { x: 0, y: 0 },
      terrainGoals: [],
      terrainSpikes: [{ x: 2, y: 1 }],
      blocks: [
        {
          id: 'resettable-block',
          position: { x: 1, y: 1 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
      spikes: [
        {
          id: 'path-spike',
          position: { x: 3, y: 0 },
          shape: [{ x: 0, y: 0 }],
        },
      ],
      paths: [
        {
          id: 'spike-path',
          travelerId: 'path-spike',
          nodes: [
            { x: 3, y: 0 },
            { x: 4, y: 0 },
          ],
          loop: 'pingPong',
        },
      ],
    });
    const displaced: typeof initial = {
      ...initial,
      blocks: [{ ...initial.blocks[0]!, position: { x: 2, y: 1 } }],
    };

    const afterTurn = move(displaced, 'down').state;
    const restored = undo(afterTurn);

    expect(afterTurn.blocks[0]?.position).toEqual({ x: 1, y: 1 });
    expect(afterTurn.spikes[0]?.position).toEqual({ x: 4, y: 0 });
    expect(afterTurn.paths[0]).toMatchObject({ currentNodeIndex: 1, direction: 1 });
    expect(afterTurn.moves).toBe(1);
    expect(restored.blocks[0]?.position).toEqual({ x: 2, y: 1 });
    expect(restored.spikes[0]?.position).toEqual({ x: 3, y: 0 });
    expect(restored.paths[0]).toMatchObject({ currentNodeIndex: 0, direction: 1 });
    expect(restored.moves).toBe(0);
  });

  it('resets when rain carries the player across a Spike, even if the final cell is safe', () => {
    const state = move(
      createGame({
        ...basicLevel,
        weather: 'rain',
        player: { x: 0, y: 1 },
        walls: [{ x: 4, y: 1 }],
        terrainSpikes: [{ x: 2, y: 1 }],
        blocks: [
          {
            id: 'unresolved-block',
            position: { x: 4, y: 0 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
      }),
      'right',
    ).state;

    expect(state.player).toEqual({ x: 0, y: 1 });
    expect(state.moves).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.history).toEqual([]);
  });

  it('returns dynamic goals and gates to their own origins after an environment turn on spikes', () => {
    const initial = createGame({
      ...basicLevel,
      width: 6,
      player: { x: 0, y: 0 },
      terrainGoals: [],
      terrainSpikes: [
        { x: 3, y: 1 },
        { x: 4, y: 1 },
      ],
      blocks: [
        {
          id: 'unresolved-block',
          position: { x: 5, y: 2 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
      goals: [
        {
          id: 'resettable-goal',
          position: { x: 1, y: 1 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          movable: true,
        },
      ],
      gates: [
        {
          id: 'resettable-gate',
          position: { x: 2, y: 1 },
          shape: [{ x: 0, y: 0 }],
        },
      ],
    });
    const displaced: typeof initial = {
      ...initial,
      goals: [{ ...initial.goals[0]!, position: { x: 3, y: 1 } }],
      gates: [{ ...initial.gates[0]!, position: { x: 4, y: 1 } }],
    };

    const state = move(displaced, 'down').state;

    expect(state.goals[0]?.position).toEqual({ x: 1, y: 1 });
    expect(state.gates[0]?.position).toEqual({ x: 2, y: 1 });
  });

  it('keeps a reset block and the player in separate cells after a normal terrain-spike reset', () => {
    const result = move(
      createGame({
        ...basicLevel,
        width: 5,
        player: { x: 1, y: 1 },
        terrainGoals: [{ x: 0, y: 0 }],
        terrainSpikes: [{ x: 4, y: 1 }],
        blocks: [
          {
            id: 'reset-demo-block',
            position: { x: 2, y: 1 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
      }),
      'right',
    );
    const reset = move(result.state, 'right');

    expect(result.didMove).toBe(true);
    expect(reset.didMove).toBe(true);
    expect(reset.state.player).toEqual({ x: 3, y: 1 });
    expect(reset.state.blocks[0]?.position).toEqual({ x: 2, y: 1 });
  });

  it('rejects a reset that would put a block into the player instead of creating the original overlap bug', () => {
    const initial = createGame({
      ...basicLevel,
      player: { x: 0, y: 1 },
      terrainGoals: [],
      terrainSpikes: [{ x: 2, y: 1 }],
      blocks: [
        {
          id: 'reset-demo-block',
          position: { x: 1, y: 1 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
    });

    const result = move(initial, 'right');

    expect(result.didMove).toBe(false);
    expect(result.event).toMatch(/reset conflict/i);
    expect(result.state).toBe(initial);
  });

  it('stops rain before a blocked movable goal instead of sliding through it', () => {
    const state = move(
      createGame({
        ...basicLevel,
        weather: 'rain',
        player: { x: 0, y: 1 },
        walls: [{ x: 3, y: 1 }],
        terrainGoals: [],
        blocks: [
          {
            id: 'unresolved-block',
            position: { x: 4, y: 0 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
        goals: [
          {
            id: 'stuck-goal',
            position: { x: 2, y: 1 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            movable: true,
          },
        ],
      }),
      'right',
    );

    expect(state.didMove).toBe(true);
    expect(state.state.player).toEqual({ x: 1, y: 1 });
    expect(state.state.goals[0]?.position).toEqual({ x: 2, y: 1 });
  });

  it('makes an adjacent pushable goal advance exactly one cell in rain', () => {
    const state = move(
      createGame({
        ...basicLevel,
        weather: 'rain',
        player: { x: 0, y: 1 },
        terrainGoals: [],
        blocks: [
          {
            id: 'unresolved-block',
            position: { x: 4, y: 0 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
        goals: [
          {
            id: 'movable-goal',
            position: { x: 1, y: 1 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            movable: true,
          },
        ],
      }),
      'right',
    ).state;

    expect(state.player).toEqual({ x: 1, y: 1 });
    expect(state.goals[0]?.position).toEqual({ x: 2, y: 1 });
  });

  it('uses an unblocked gate as a rain landing cell and then exits in the input direction', () => {
    const state = move(
      createGame({
        ...basicLevel,
        width: 7,
        weather: 'rain',
        player: { x: 0, y: 1 },
        terrainGoals: [],
        blocks: [
          {
            id: 'unresolved-block',
            position: { x: 6, y: 2 },
            shape: [{ x: 0, y: 0 }],
            number: 0,
            isFake: false,
          },
        ],
        gates: [
          {
            id: 'rain-entry',
            position: { x: 3, y: 1 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'rain-exit',
          },
          {
            id: 'rain-exit',
            position: { x: 4, y: 0 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'rain-entry',
          },
        ],
      }),
      'right',
    ).state;

    expect(state.player).toEqual({ x: 5, y: 0 });
    expect(state.moves).toBe(1);
  });

  it('advances loop and ping-pong spike paths by one node while leaving blocked paths in place', () => {
    const initial = createGame({
      ...basicLevel,
      width: 6,
      player: { x: 0, y: 0 },
      terrainGoals: [],
      blocks: [
        {
          id: 'unresolved-block',
          position: { x: 4, y: 2 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
        {
          id: 'path-blocker',
          position: { x: 2, y: 2 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
      spikes: [
        { id: 'loop-spike', position: { x: 1, y: 1 }, shape: [{ x: 0, y: 0 }] },
        { id: 'ping-spike', position: { x: 3, y: 0 }, shape: [{ x: 0, y: 0 }] },
        { id: 'blocked-spike', position: { x: 1, y: 2 }, shape: [{ x: 0, y: 0 }] },
      ],
      paths: [
        {
          id: 'loop-path',
          travelerId: 'loop-spike',
          nodes: [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
          ],
          loop: 'loop',
        },
        {
          id: 'ping-path',
          travelerId: 'ping-spike',
          nodes: [
            { x: 3, y: 0 },
            { x: 4, y: 0 },
          ],
          loop: 'pingPong',
        },
        {
          id: 'blocked-path',
          travelerId: 'blocked-spike',
          nodes: [
            { x: 1, y: 2 },
            { x: 2, y: 2 },
          ],
          loop: 'once',
        },
      ],
    });

    const afterFirstTurn = move(initial, 'down').state;
    const afterSecondTurn = move(afterFirstTurn, 'up').state;

    expect(afterFirstTurn.spikes.find((spike) => spike.id === 'loop-spike')?.position).toEqual({ x: 2, y: 1 });
    expect(afterFirstTurn.spikes.find((spike) => spike.id === 'ping-spike')?.position).toEqual({ x: 4, y: 0 });
    expect(afterFirstTurn.spikes.find((spike) => spike.id === 'blocked-spike')?.position).toEqual({ x: 1, y: 2 });
    expect(afterSecondTurn.spikes.find((spike) => spike.id === 'loop-spike')?.position).toEqual({ x: 1, y: 1 });
    expect(afterSecondTurn.spikes.find((spike) => spike.id === 'ping-spike')?.position).toEqual({ x: 3, y: 0 });
    expect(afterSecondTurn.paths.find((path) => path.id === 'ping-path')).toMatchObject({
      currentNodeIndex: 0,
      direction: -1,
    });
  });

  it('resets the level when a Path Spike enters the Role instead of treating the Role as a path blocker', () => {
    const initial = createGame({
      ...basicLevel,
      width: 4,
      player: { x: 1, y: 0 },
      terrainGoals: [],
      blocks: [
        {
          id: 'unresolved-block',
          position: { x: 3, y: 2 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
      spikes: [{ id: 'path-spike', position: { x: 0, y: 1 }, shape: [{ x: 0, y: 0 }] }],
      paths: [
        {
          id: 'path',
          travelerId: 'path-spike',
          nodes: [
            { x: 0, y: 1 },
            { x: 1, y: 1 },
          ],
          loop: 'once',
        },
      ],
    });

    const result = move(initial, 'down');

    expect(result.didMove).toBe(true);
    expect(result.state).toMatchObject({
      player: { x: 1, y: 0 },
      moves: 0,
      status: 'playing',
      history: [],
    });
    expect(result.state.spikes[0]?.position).toEqual({ x: 0, y: 1 });
    expect(result.state.paths[0]).toMatchObject({ currentNodeIndex: 0, direction: 1 });
  });

  it('restores every movable item, path, timer, and history from the level after Spike death', () => {
    const initial = createGame({
      ...basicLevel,
      width: 6,
      player: { x: 0, y: 1 },
      terrainGoals: [],
      terrainSpikes: [{ x: 1, y: 1 }],
      timeLimitSeconds: 9,
      blocks: [
        {
          id: 'block',
          position: { x: 3, y: 0 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
      goals: [{ id: 'goal', position: { x: 3, y: 1 }, shape: [{ x: 0, y: 0 }], number: 0, movable: true }],
      gates: [{ id: 'gate', position: { x: 3, y: 2 }, shape: [{ x: 0, y: 0 }] }],
      spikes: [{ id: 'path-spike', position: { x: 4, y: 0 }, shape: [{ x: 0, y: 0 }] }],
      paths: [
        {
          id: 'path',
          travelerId: 'path-spike',
          nodes: [
            { x: 4, y: 0 },
            { x: 5, y: 0 },
          ],
          loop: 'pingPong',
        },
      ],
    });
    const progressed = {
      ...initial,
      blocks: [{ ...initial.blocks[0]!, position: { x: 4, y: 0 } }],
      goals: [{ ...initial.goals[0]!, position: { x: 4, y: 1 } }],
      gates: [{ ...initial.gates[0]!, position: { x: 4, y: 2 } }],
      spikes: [{ ...initial.spikes[0]!, position: { x: 5, y: 0 } }],
      paths: [{ ...initial.paths[0]!, currentNodeIndex: 1, direction: -1 as const }],
      moves: 7,
      remainingSeconds: 2,
      history: [initial],
    };

    const result = move(progressed, 'right').state;

    expect(result).toMatchObject({
      player: { x: 0, y: 1 },
      moves: 0,
      remainingSeconds: 9,
      status: 'playing',
      history: [],
    });
    expect(result.blocks[0]?.position).toEqual({ x: 3, y: 0 });
    expect(result.goals[0]?.position).toEqual({ x: 3, y: 1 });
    expect(result.gates[0]?.position).toEqual({ x: 3, y: 2 });
    expect(result.spikes[0]?.position).toEqual({ x: 4, y: 0 });
    expect(result.paths[0]).toMatchObject({ currentNodeIndex: 0, direction: 1 });
  });

  it('applies optional step and time limits before victory, and restarts from the immutable level definition', () => {
    const limitedLevel: LevelDefinition = { ...basicLevel, stepLimit: 1, timeLimitSeconds: 5 };
    const afterMove = move(createGame(limitedLevel), 'right').state;
    const afterTwoSeconds = tick(createGame(limitedLevel), 2);
    const expired = tick(afterTwoSeconds, 3);
    const restarted = restart(afterMove);

    expect(afterMove.status).toBe('lost');
    expect(afterTwoSeconds.remainingSeconds).toBe(3);
    expect(expired.status).toBe('lost');
    expect(tick(expired, 1)).toEqual(expired);
    expect(restarted).toMatchObject({
      player: { x: 1, y: 1 },
      moves: 0,
      remainingSeconds: 5,
      status: 'playing',
      history: [],
    });
  });

  it('rejects malformed links and paths when a level is loaded', () => {
    expect(() =>
      createGame({
        ...basicLevel,
        gates: [
          {
            id: 'broken-gate',
            position: { x: 0, y: 0 },
            shape: [{ x: 0, y: 0 }],
            nextGateId: 'missing-gate',
          },
        ],
      }),
    ).toThrow(/missing gate/i);
    expect(() =>
      createGame({
        ...basicLevel,
        paths: [
          {
            id: 'not-a-spike-path',
            travelerId: 'block-a',
            nodes: [
              { x: 0, y: 0 },
              { x: 2, y: 0 },
            ],
            loop: 'once',
          },
        ],
      }),
    ).toThrow(/spike.*unit/i);
  });

  it('rejects hard spawn overlaps and refuses a reset that would create one', () => {
    expect(() =>
      createGame({
        ...basicLevel,
        gates: [
          {
            id: 'overlapping-gate',
            position: { x: 2, y: 1 },
            shape: [{ x: 0, y: 0 }],
          },
        ],
      }),
    ).toThrow(/overlaps/i);

    const initial = createGame({
      ...basicLevel,
      width: 7,
      player: { x: 0, y: 0 },
      terrainGoals: [],
      terrainSpikes: [{ x: 3, y: 1 }],
      blocks: [
        {
          id: 'resettable-block',
          position: { x: 1, y: 1 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
        {
          id: 'occupying-block',
          position: { x: 5, y: 2 },
          shape: [{ x: 0, y: 0 }],
          number: 0,
          isFake: false,
        },
      ],
    });
    const unsafeState: typeof initial = {
      ...initial,
      blocks: [
        { ...initial.blocks[0]!, position: { x: 3, y: 1 } },
        { ...initial.blocks[1]!, position: { x: 1, y: 1 } },
      ],
    };

    const result = move(unsafeState, 'down');

    expect(result.didMove).toBe(false);
    expect(result.event).toMatch(/reset conflict/i);
    expect(result.state).toBe(unsafeState);
  });
});
