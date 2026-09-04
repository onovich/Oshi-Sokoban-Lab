import { createGame, move } from '../engine/game-engine';
import type { Direction, DomainEvent, GameState, GateTraversal, LevelDefinition } from '../engine/types';
import { BOARD_MOTION_TIMING } from './board-motion-timing';
import { hasObjectReset, SPIKE_RESET_TIMING } from './spike-reset-presentation';

export type SolutionFrame = Readonly<{
  state: GameState;
  direction?: Direction;
  events: readonly DomainEvent[];
  gateTraversal?: GateTraversal;
}>;

/** Replay with the real rules, rejecting incomplete/invalid worker results before showing them. */
export function buildSolutionReplay(board: LevelDefinition, directions: readonly Direction[]): readonly SolutionFrame[] {
  if (!Array.isArray(directions) || directions.length > 10_000) throw new Error('Invalid solution length.');
  let state = createGame(board);
  const frames: SolutionFrame[] = [{ state, events: [] }];
  for (const direction of directions) {
    if (!['up', 'down', 'left', 'right'].includes(direction)) throw new Error('Invalid solution direction.');
    const result = move(state, direction);
    if (!result.didMove || result.state.status === 'lost') throw new Error('Solution cannot be replayed.');
    // Playback keeps its own frames; it does not need a growing Undo history in every frame.
    state = { ...result.state, history: [] };
    frames.push({ state, direction, events: result.events, gateTraversal: result.gateTraversal });
  }
  if (state.status !== 'won') throw new Error('Solution does not finish the level.');
  return frames;
}

export function solutionFrameDuration(frame: SolutionFrame, reducedMotion: boolean): number {
  const resetDuration = hasObjectReset(frame.events)
    ? reducedMotion ? SPIKE_RESET_TIMING.reducedMotionTotalMs : SPIKE_RESET_TIMING.totalMs
    : 0;
  const gateDuration = frame.gateTraversal && !reducedMotion
    ? BOARD_MOTION_TIMING.gateSegmentMs * 2 + BOARD_MOTION_TIMING.gateHopMs
    : 0;
  return Math.max(resetDuration, gateDuration, reducedMotion ? 0 : BOARD_MOTION_TIMING.moveMs);
}
