import { describe, expect, it } from 'vitest';

import { createGame, move } from './game-engine';
import { occupancyLevels } from '../levels/families/occupancy-levels';
import { movableGoalLevels } from '../levels/families/movable-goal-levels';
import { gateLevels } from '../levels/families/gate-levels';
import { spikeResetLevels } from '../levels/families/spike-reset-levels';
import type { LevelDefinition } from './types';
import { cell, oneCell } from '../levels/families/shared';

describe('typed domain events', () => {
  it('reports a Block push through the public move result', () => {
    const result = move(createGame(occupancyLevels[0]!), 'right');

    expect(result.events).toContainEqual({
      type: 'block-pushed',
      entityId: 'occupancy-guide-domino',
      from: { x: 1, y: 1 },
      to: { x: 2, y: 1 },
    });
  });

  it('reports a movable Goal push as a distinct event', () => {
    const result = move(createGame(movableGoalLevels[0]!), 'right');

    expect(result.events).toContainEqual({
      type: 'goal-pushed',
      entityId: 'movable-goal-guide-goal',
      from: { x: 1, y: 1 },
      to: { x: 2, y: 1 },
    });
  });

  it('reports crossing a blocked movable Goal without reporting a push', () => {
    const result = move(createGame(movableGoalLevels[1]!), 'right');

    expect(result.events).toContainEqual({
      type: 'goal-crossed',
      entityId: 'movable-goal-verify-goal',
      at: { x: 1, y: 0 },
    });
    expect(result.events.some((event) => event.type === 'goal-pushed')).toBe(false);
  });

  it('reports the exact entrance, exit, and direction of a Gate traversal', () => {
    const result = move(createGame(gateLevels[0]!), 'right');

    expect(result.events).toContainEqual({
      type: 'gate-traversed',
      entryGateId: 'gate-guide-entry',
      exitGateId: 'gate-guide-exit',
      direction: 'right',
      from: { x: 0, y: 1 },
      entry: { x: 1, y: 1 },
      exit: { x: 3, y: 0 },
      to: { x: 4, y: 0 },
    });
  });

  it('reports a Gate push separately from Gate traversal', () => {
    const result = move(createGame(gateLevels[1]!), 'right');

    expect(result.events).toContainEqual({
      type: 'gate-pushed',
      entityId: 'gate-verify-entry',
      from: { x: 1, y: 1 },
      to: { x: 2, y: 1 },
    });
    expect(result.events.some((event) => event.type === 'gate-traversed')).toBe(false);
  });

  it('reports a Rain slide without treating it as a push', () => {
    const rainLevel: LevelDefinition = {
      id: 'event-rain', title: 'Rain event', width: 5, height: 2, weather: 'rain', player: cell(0, 0),
      walls: [cell(3, 0)], terrainGoals: [cell(4, 1)], terrainSpikes: [],
      blocks: [{ id: 'rain-block', position: cell(0, 1), shape: oneCell, number: 0, isFake: false }],
      goals: [], gates: [], spikes: [], paths: [],
    };

    const result = move(createGame(rainLevel), 'right');

    expect(result.events).toContainEqual({
      type: 'rain-slid',
      direction: 'right',
      from: { x: 0, y: 0 },
      to: { x: 2, y: 0 },
    });
  });

  it('reports a whole-object Spike reset after the triggering push', () => {
    const afterFirstPush = move(createGame(spikeResetLevels[0]!), 'right').state;
    const result = move(afterFirstPush, 'right');

    expect(result.events).toContainEqual({
      type: 'object-reset',
      entityType: 'block',
      entityId: 'spike-guide-block',
      reason: 'spike',
      from: { x: 4, y: 0 },
      to: { x: 2, y: 0 },
      contactCells: [{ x: 4, y: 0 }],
    });
  });

  it('reports the remote footprint cell that actually touched a Spike', () => {
    const level: LevelDefinition = {
      id: 'event-footprint-reset', title: 'Footprint reset event', width: 5, height: 3,
      weather: 'clear', player: cell(0, 0), walls: [], terrainGoals: [], terrainSpikes: [cell(3, 1)],
      blocks: [{
        id: 'domino', position: cell(1, 0), shape: [cell(0, 0), cell(0, 1)], number: 0, isFake: false,
      }],
      goals: [], gates: [], spikes: [], paths: [],
    };
    const afterFirstPush = move(createGame(level), 'right').state;
    const result = move(afterFirstPush, 'right');

    expect(result.events).toContainEqual({
      type: 'object-reset', entityType: 'block', entityId: 'domino', reason: 'spike',
      from: cell(3, 0), to: cell(1, 0), contactCells: [cell(3, 1)],
    });
  });

  it('reports the Spike contact when a movable Goal respawns', () => {
    const level: LevelDefinition = {
      id: 'event-goal-reset', title: 'Goal reset event', width: 5, height: 2,
      weather: 'clear', player: cell(0, 0), walls: [], terrainGoals: [], terrainSpikes: [cell(3, 0)],
      blocks: [{ id: 'unresolved', position: cell(4, 1), shape: oneCell, number: 0, isFake: false }],
      goals: [{ id: 'reset-goal', position: cell(1, 0), shape: oneCell, number: 0, movable: true }],
      gates: [], spikes: [], paths: [],
    };
    const afterFirstPush = move(createGame(level), 'right').state;
    const result = move(afterFirstPush, 'right');

    expect(result.events).toContainEqual({
      type: 'object-reset', entityType: 'goal', entityId: 'reset-goal', reason: 'spike',
      from: cell(3, 0), to: cell(1, 0), contactCells: [cell(3, 0)],
    });
  });

  it('reports the Spike contact when a blocked Gate respawns', () => {
    const level: LevelDefinition = {
      id: 'event-gate-reset', title: 'Gate reset event', width: 6, height: 2,
      weather: 'clear', player: cell(0, 0), walls: [cell(5, 1)], terrainGoals: [], terrainSpikes: [cell(3, 0)],
      blocks: [{ id: 'unresolved', position: cell(0, 1), shape: oneCell, number: 0, isFake: false }],
      goals: [],
      gates: [
        { id: 'reset-gate', position: cell(1, 0), shape: oneCell, nextGateId: 'exit-gate' },
        { id: 'exit-gate', position: cell(4, 1), shape: oneCell, nextGateId: 'reset-gate' },
      ],
      spikes: [], paths: [],
    };
    const afterFirstPush = move(createGame(level), 'right').state;
    const result = move(afterFirstPush, 'right');

    expect(result.events).toContainEqual({
      type: 'object-reset', entityType: 'gate', entityId: 'reset-gate', reason: 'spike',
      from: cell(3, 0), to: cell(1, 0), contactCells: [cell(3, 0)],
    });
  });

  it('reports Spike death as an independent full-state reset event', () => {
    const deathLevel: LevelDefinition = {
      id: 'event-death', title: 'Death event', width: 4, height: 1, weather: 'clear', player: cell(0, 0),
      walls: [], terrainGoals: [cell(3, 0)], terrainSpikes: [cell(1, 0)],
      blocks: [{ id: 'death-block', position: cell(2, 0), shape: oneCell, number: 0, isFake: false }],
      goals: [], gates: [], spikes: [], paths: [],
    };

    const result = move(createGame(deathLevel), 'right');

    expect(result.events).toContainEqual({ type: 'death-reset', reason: 'spike' });
    expect(result.state.player).toEqual(deathLevel.player);
    expect(result.state.moves).toBe(0);
    expect(result.state.history).toEqual([]);
  });
});
