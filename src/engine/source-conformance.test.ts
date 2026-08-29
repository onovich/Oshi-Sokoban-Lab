import { describe, expect, it } from 'vitest';

import { createGame, move } from './game-engine';
import type { Cell, LevelDefinition } from './types';

const cell = (x: number, y: number): Cell => ({ x, y });
const oneCell = [cell(0, 0)] as const;

const sourceContractLevel: LevelDefinition = {
  id: 'source-contract',
  title: 'Source contract',
  width: 6,
  height: 3,
  weather: 'clear',
  player: cell(0, 1),
  walls: [],
  terrainGoals: [],
  terrainSpikes: [],
  blocks: [],
  goals: [],
  gates: [],
  spikes: [],
  paths: [],
};

function unresolvedBlock(id: string, position: Cell) {
  return { id, position, shape: oneCell, number: 0, isFake: false } as const;
}

describe('Oshi source contracts and explicit Web overrides', () => {
  it('keeps a Block out of a Gate instead of transmitting it', () => {
    const result = move(
      createGame({
        ...sourceContractLevel,
        blocks: [unresolvedBlock('block', cell(1, 1))],
        gates: [{ id: 'gate', position: cell(2, 1), shape: oneCell }],
      }),
      'right',
    );

    expect(result.didMove).toBe(false);
    expect(result.state.player).toEqual(cell(0, 1));
    expect(result.state.blocks[0]?.position).toEqual(cell(1, 1));
  });

  it('preserves the entry direction and permits a Gate exit to land on a Goal', () => {
    const result = move(
      createGame({
        ...sourceContractLevel,
        blocks: [unresolvedBlock('unresolved-block', cell(0, 0))],
        goals: [{ id: 'goal', position: cell(4, 1), shape: oneCell, number: 0, movable: false }],
        gates: [
          { id: 'entry', position: cell(1, 1), shape: oneCell, nextGateId: 'exit' },
          { id: 'exit', position: cell(3, 1), shape: oneCell, nextGateId: 'entry' },
        ],
      }),
      'right',
    );

    expect(result.didMove).toBe(true);
    expect(result.state.player).toEqual(cell(4, 1));
    expect(result.state.goals[0]?.position).toEqual(cell(4, 1));
  });

  it('resets a Fake Block from a Spike even though the Fake Block never contributes to victory', () => {
    const initial = createGame({
      ...sourceContractLevel,
      height: 2,
      player: cell(0, 0),
      terrainSpikes: [cell(3, 0)],
      blocks: [
        { id: 'fake', position: cell(1, 0), shape: oneCell, number: 0, isFake: true },
        unresolvedBlock('unresolved-block', cell(5, 1)),
      ],
    });
    const displaced = {
      ...initial,
      blocks: [{ ...initial.blocks[0]!, position: cell(3, 0) }, initial.blocks[1]!],
    };

    const result = move(displaced, 'down');

    expect(result.didMove).toBe(true);
    expect(result.state.blocks.find((block) => block.id === 'fake')?.position).toEqual(cell(1, 0));
    expect(result.state.status).toBe('playing');
  });

  it('lets a moving Spike cross Goal and Gate layers, which are not Path blockers in the source rules', () => {
    const result = move(
      createGame({
        ...sourceContractLevel,
        player: cell(0, 0),
        blocks: [unresolvedBlock('unresolved-block', cell(3, 0))],
        goals: [{ id: 'goal', position: cell(2, 1), shape: oneCell, number: 0, movable: false }],
        gates: [{ id: 'gate', position: cell(2, 1), shape: oneCell }],
        spikes: [{ id: 'moving-spike', position: cell(1, 1), shape: oneCell }],
        paths: [
          {
            id: 'spike-path',
            travelerId: 'moving-spike',
            nodes: [cell(1, 1), cell(2, 1)],
            loop: 'once',
          },
        ],
      }),
      'down',
    );

    expect(result.didMove).toBe(true);
    expect(result.state.spikes[0]?.position).toEqual(cell(2, 1));
  });

  it('resets the current level when the Role actively enters a terrain or dynamic Spike', () => {
    const terrainResult = move(
      createGame({
        ...sourceContractLevel,
        terrainSpikes: [cell(1, 1)],
        blocks: [unresolvedBlock('unresolved-terrain-block', cell(5, 2))],
      }),
      'right',
    );
    const dynamicResult = move(
      createGame({
        ...sourceContractLevel,
        spikes: [{ id: 'static-dynamic-spike', position: cell(1, 1), shape: oneCell }],
        blocks: [unresolvedBlock('unresolved-dynamic-block', cell(5, 2))],
      }),
      'right',
    );

    expect(terrainResult.state).toMatchObject({ player: cell(0, 1), moves: 0, status: 'playing', history: [] });
    expect(dynamicResult.state).toMatchObject({ player: cell(0, 1), moves: 0, status: 'playing', history: [] });
  });

  it('lets a Path Spike reach the Role at a positive-direction endpoint, then resets the level', () => {
    const result = move(
      createGame({
        ...sourceContractLevel,
        player: cell(2, 1),
        blocks: [unresolvedBlock('unresolved-block', cell(5, 2))],
        spikes: [{ id: 'path-spike', position: cell(0, 1), shape: oneCell }],
        paths: [
          {
            id: 'path',
            travelerId: 'path-spike',
            nodes: [cell(0, 1), cell(1, 1)],
            loop: 'pingPong',
          },
        ],
      }),
      'left',
    ).state;

    expect(result.status).toBe('playing');
    expect(result.player).toEqual(cell(2, 1));
    expect(result.spikes[0]?.position).toEqual(cell(0, 1));
    expect(result.paths[0]).toMatchObject({ currentNodeIndex: 0, direction: 1 });
    expect(result.moves).toBe(0);
    expect(result.history).toEqual([]);
  });

  it('lets a Path Spike reach the Role at a negative-direction endpoint, then resets to its level direction', () => {
    const initial = createGame({
      ...sourceContractLevel,
      player: cell(0, 0),
      blocks: [unresolvedBlock('unresolved-block', cell(5, 2))],
      spikes: [{ id: 'path-spike', position: cell(0, 1), shape: oneCell }],
      paths: [
        {
          id: 'path',
          travelerId: 'path-spike',
          nodes: [cell(0, 1), cell(1, 1)],
          loop: 'pingPong',
        },
      ],
    });
    const atSecondNode = {
      ...initial,
      spikes: [{ ...initial.spikes[0]!, position: cell(1, 1) }],
      paths: [{ ...initial.paths[0]!, currentNodeIndex: 1, direction: -1 as const }],
    };

    const result = move(atSecondNode, 'down').state;

    expect(result.status).toBe('playing');
    expect(result.player).toEqual(cell(0, 0));
    expect(result.spikes[0]?.position).toEqual(cell(0, 1));
    expect(result.paths[0]).toMatchObject({ currentNodeIndex: 0, direction: 1 });
    expect(result.moves).toBe(0);
    expect(result.history).toEqual([]);
  });

  it('lets a multi-cell Path Spike reach the Role through any covered footprint cell, then resets the level', () => {
    const result = move(
      createGame({
        ...sourceContractLevel,
        player: cell(2, 0),
        blocks: [unresolvedBlock('unresolved-block', cell(5, 2))],
        spikes: [
          {
            id: 'wide-path-spike',
            position: cell(0, 1),
            shape: [cell(0, 0), cell(1, 0)],
          },
        ],
        paths: [
          {
            id: 'wide-path',
            travelerId: 'wide-path-spike',
            nodes: [cell(0, 1), cell(1, 1)],
            loop: 'once',
          },
        ],
      }),
      'down',
    ).state;

    expect(result.status).toBe('playing');
    expect(result.player).toEqual(cell(2, 0));
    expect(result.spikes[0]?.position).toEqual(cell(0, 1));
    expect(result.paths[0]).toMatchObject({ currentNodeIndex: 0, direction: 1 });
    expect(result.moves).toBe(0);
    expect(result.history).toEqual([]);
  });
});
