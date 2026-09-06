import { describe, expect, it } from 'vitest';

import { evaluateProofConditions } from '../../course/proof-evaluator';
import { createGame, move, restart, undo } from '../../engine/game-engine';
import { auditLevelMutations } from '../level-mutation-audit';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e02ReturnDoor, e02ReturnReservation } from './e02-return-teaching';

describe('E02 return-position teaching chain', () => {
  it('starts with a complete puzzle that requires lending and reclaiming one finished shape', () => {
    const initial = createGame(e02ReturnDoor.board);
    expect(initial.status).toBe('playing');
    expect(initial.blocks).toHaveLength(2);
    expect(initial.blocks[0]!.shape).toHaveLength(2);
    const report = searchSpatialExperiment(initial);
    expect(report.status).toBe('solved');
    let state = initial;
    const batches = report.solution!.map((direction) => {
      const result = move(state, direction);
      expect(result.didMove).toBe(true);
      state = result.state;
      return { events: result.events, pushes: result.events.filter((event) => event.type === 'block-pushed').length };
    });
    expect(state.status).toBe('won');
    expect(evaluateProofConditions(e02ReturnDoor.theorem.proofConditions, batches)
      .every((check) => check.satisfied)).toBe(true);
    expect(report.pushes).toBeLessThanOrEqual(6);
  });

  it('cannot complete the second task while keeping the finished shape fixed', () => {
    const report = searchSpatialExperiment(createGame(e02ReturnDoor.board), {
      forbiddenConditions: e02ReturnDoor.theorem.proofConditions,
    });
    expect(report.status).toBe('proven-unsolved');
    expect(report.forbiddenTransitions).toBeGreaterThan(0);
  });

  it('keeps failed experiments recoverable and contains no unused floor', () => {
    const initial = createGame(e02ReturnDoor.board);
    const experiment = move(initial, 'up');
    expect(experiment.didMove).toBe(true);
    expect(undo(experiment.state)).toEqual(initial);
    expect(restart(experiment.state)).toEqual(initial);
    const audit = auditLevelMutations(e02ReturnDoor, 100_000);
    expect(audit.filter((item) => item.classification === 'redundant')).toEqual([]);
    expect(audit.every((item) => item.effect === 'unsolvable' || item.effect === 'bypass-created')).toBe(true);
  });

  it('then makes an attractive early completion consume the only return side', () => {
    const initial = createGame(e02ReturnReservation.board);
    const report = searchSpatialExperiment(initial);
    expect(report.status).toBe('solved');
    let state = initial;
    const batches = report.solution!.map((direction) => {
      const result = move(state, direction);
      expect(result.didMove).toBe(true);
      state = result.state;
      return {
        events: result.events,
        pushes: result.events.filter((event) => event.type === 'block-pushed').length,
      };
    });
    expect(state.status).toBe('won');
    expect(evaluateProofConditions(e02ReturnReservation.theorem.proofConditions, batches)
      .every((check) => check.satisfied)).toBe(true);
  });

  it('turns the nearby Goal into a reversible, one-variable boundary test', () => {
    const initial = createGame(e02ReturnReservation.board);
    let beforeMistake = initial;
    for (const direction of ['down', 'down', 'left'] as const) {
      const result = move(beforeMistake, direction);
      expect(result.didMove).toBe(true);
      beforeMistake = result.state;
    }
    const mistake = move(beforeMistake, 'up');
    expect(mistake.didMove).toBe(true);
    const premature = mistake.state;
    expect(undo(premature)).toEqual(beforeMistake);
    expect(premature.blocks.find((block) => block.id.endsWith('-b'))?.position).toEqual(cell(1, 2));
    expect(searchSpatialExperiment(premature).status).toBe('proven-unsolved');
    expect(restart(premature)).toEqual(initial);

    const decoupledBoard = {
      ...e02ReturnReservation.board,
      walls: e02ReturnReservation.board.walls.filter((wall) => wall.x !== 1 || wall.y !== 1),
    };
    let decoupled = createGame(decoupledBoard);
    for (const direction of ['down', 'down', 'left', 'up'] as const) {
      const result = move(decoupled, direction);
      expect(result.didMove).toBe(true);
      decoupled = result.state;
    }
    expect(searchSpatialExperiment(decoupled, {
      forbiddenTransition: (_before, result) => result.state.blocks.some((block) =>
        block.shape.some((part) => block.position.x + part.x === 1 && block.position.y + part.y === 1)),
    }).status).toBe('solved');
  });

  it('requires the reservation sequence and keeps every authored element consequential', () => {
    const counterfactual = searchSpatialExperiment(createGame(e02ReturnReservation.board), {
      forbiddenConditions: e02ReturnReservation.theorem.proofConditions,
    });
    expect(counterfactual.status).toBe('proven-unsolved');
    expect(counterfactual.forbiddenTransitions).toBeGreaterThan(0);
    const audit = auditLevelMutations(e02ReturnReservation, 100_000);
    expect(audit.filter((item) => item.classification === 'redundant')).toEqual([]);
    expect(audit.every((item) => item.effect === 'unsolvable' || item.effect === 'bypass-created')).toBe(true);
  });
});

const cell = (x: number, y: number) => ({ x, y });
