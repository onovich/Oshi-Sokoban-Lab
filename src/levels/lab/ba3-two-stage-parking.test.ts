import { describe, expect, it } from 'vitest';
import { createGame, isBlockSolved, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { ba3TwoStageParking } from './ba3-two-stage-parking';
import type { ProofCondition } from '../../course/types';

describe('BA3: opening the entrance does not also open the return route', () => {
  it('starts with two unfinished objects and needs to revoke the first parking arrangement', () => {
    const initial = createGame(ba3TwoStageParking.board);
    expect(initial.blocks.every(block => !isBlockSolved(initial, block))).toBe(true);
    const options = { maximumStates: 80000, maximumPlans: 1, pushSlack: 0, moveSlack: 0 };
    const result = solveLevel(ba3TwoStageParking, options);
    expect(result.status).toBe('solved');
    let state = initial;
    for (const direction of result.bestPlan!.directions) {
      const turn = move(state, direction);
      expect(turn.didMove).toBe(true);
      state = turn.state;
    }
    expect(state.status).toBe('won');
    expect(solveLevel(ba3TwoStageParking, { ...options,
      forbiddenConditions: ba3TwoStageParking.theorem.proofConditions,
    }).status).toBe('proven-unsolved');
  });
  it('releases the re-parking requirement when B gains an independent lower turning bay', () => {
    const spec = ba3TwoStageParking;
    const contrast = { ...spec, board: { ...spec.board,
      walls: spec.board.walls.filter(cell => !(cell.x === 1 && (cell.y === 4 || cell.y === 5))),
    } };
    const departure: ProofCondition = { kind: 'event', event: {
      key: `event:block-pushed:${spec.id}-a:from:3,1:to:3,2`,
    } };
    expect(solveLevel(contrast, { maximumStates: 80000, maximumPlans: 1,
      moveSlack: 0, pushSlack: 0, forbiddenConditions: [departure],
    }).status).toBe('solved');
  });
});
