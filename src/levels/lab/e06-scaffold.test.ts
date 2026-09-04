import { describe, expect, it } from 'vitest';

import { createGame, move, restart, undo } from '../../engine/game-engine';
import { rewriteProofCondition } from '../../course/proof-condition';
import { evaluateProofConditions } from '../../course/proof-evaluator';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { auditLevelMutations } from '../level-mutation-audit';
import { e06Scaffold } from './e06-scaffold';
import { e06Contrast, e06Prototype } from './e06-experiment';

describe('E06 playable learning scaffold', () => {
  it('is a complete two-task puzzle with a short real-rule replay', () => {
    expect(e06Scaffold.board.blocks).toHaveLength(2);
    const initial = createGame(e06Scaffold.board);
    expect(initial.status).toBe('playing');
    const report = searchSpatialExperiment(initial);
    expect(report.status).toBe('solved');
    expect(report.pushes).toBeLessThanOrEqual(12);
    let state = initial;
    for (const direction of report.solution!) state = move(state, direction).state;
    expect(state.status).toBe('won');
  });

  it('cannot skip the temporary opening before advancing the other task', () => {
    expect(e06Scaffold.theorem.proofConditions).toHaveLength(1);
    const report = searchSpatialExperiment(createGame(e06Scaffold.board), {
      forbiddenConditions: e06Scaffold.theorem.proofConditions,
    });
    expect(report.status).toBe('proven-unsolved');
    expect(report.forbiddenTransitions).toBeGreaterThan(0);
  });

  it('contains no unused empty floor or invalid mutation counted as evidence', () => {
    const audit = auditLevelMutations(e06Scaffold, 100_000);
    expect(audit.filter((result) => result.classification === 'redundant')).toEqual([]);
    expect(audit.every((result) => result.effect === 'unsolvable' || result.effect === 'bypass-created')).toBe(true);
  });

  it('transfers the same opening and push-side relation to real solutions of both harder boards', () => {
    const mapped = e06Scaffold.theorem.proofConditions.map((condition) => rewriteProofCondition(
      condition,
      (key) => key.replaceAll(e06Scaffold.id, e06Prototype.id)
        .replace(/(from|to):(\d+),(\d+)/g, (_match, end: string, x: string, y: string) =>
          `${end}:${x},${Number(y) + 1}`),
    ));
    const hard = searchSpatialExperiment(createGame(e06Prototype.board), { maximumStates: 200_000 });
    expect(hard.status).toBe('solved');
    for (const spec of [e06Prototype, e06Contrast]) {
      let state = createGame(spec.board);
      const batches = hard.solution!.map((direction) => {
        const result = move(state, direction);
        expect(result.didMove).toBe(true);
        state = result.state;
        return { events: result.events, pushes: result.events.filter((event) => event.type === 'block-pushed').length };
      });
      expect(state.status).toBe('won');
      expect(evaluateProofConditions(mapped, batches).every((check) => check.satisfied)).toBe(true);
    }
    expect(searchSpatialExperiment(createGame(e06Prototype.board), {
      maximumStates: 200_000, forbiddenConditions: mapped,
    }).status).toBe('proven-unsolved');
    // The same technique is valid in the contrast, not its only possible strategy.
    expect(searchSpatialExperiment(createGame(e06Contrast.board), {
      maximumStates: 200_000, forbiddenConditions: mapped,
    }).status).toBe('solved');
  });

  it('checks that each task constrains a surviving task, without relying on missing event IDs', () => {
    const noLeftStaging = (_before: ReturnType<typeof createGame>, result: ReturnType<typeof move>) =>
      result.events.some((event) => event.type === 'block-pushed' &&
        event.entityId === `${e06Scaffold.id}-a` && event.to.x < event.from.x);
    expect(searchSpatialExperiment(createGame(e06Scaffold.board), {
      forbiddenTransition: noLeftStaging,
    }).status).toBe('proven-unsolved');
    const withoutSmallBlock = createGame({
      ...e06Scaffold.board, blocks: [e06Scaffold.board.blocks[0]!],
    });
    expect(searchSpatialExperiment(withoutSmallBlock, { forbiddenTransition: noLeftStaging }).status).toBe('solved');

    let withoutLongBlock = createGame({
      ...e06Scaffold.board, blocks: [e06Scaffold.board.blocks[1]!],
    });
    for (const direction of ['left', 'left', 'up'] as const) {
      const result = move(withoutLongBlock, direction);
      expect(result.didMove).toBe(true);
      expect(result.events).toEqual([]);
      withoutLongBlock = result.state;
    }
    expect(withoutLongBlock.player).toEqual({ x: 2, y: 1 });
  });

  it('keeps a mistaken experiment recoverable with Undo and Restart', () => {
    const initial = createGame(e06Scaffold.board);
    const first = move(initial, 'up').state;
    const mistake = move(first, 'left');
    expect(mistake.didMove).toBe(true);
    expect(searchSpatialExperiment(mistake.state).status).toBe('proven-unsolved');
    expect(undo(mistake.state)).toEqual(first);
    expect(searchSpatialExperiment(undo(mistake.state)).status).toBe('solved');
    expect(restart(mistake.state)).toEqual(initial);
  });
});
