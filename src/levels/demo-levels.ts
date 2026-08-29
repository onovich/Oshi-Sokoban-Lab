import type { LevelDefinition } from '../engine/types';
import { gateLevels } from './families/gate-levels';
import { movableGoalLevels } from './families/movable-goal-levels';
import { occupancyLevels } from './families/occupancy-levels';
import { spikeResetLevels } from './families/spike-reset-levels';

/**
 * The playable curriculum is deliberately composed at the family boundary.
 * Add a future family in its own module, then place it here to define the
 * teaching order without mixing its map data into unrelated mechanics.
 */
export const demoLevels: readonly LevelDefinition[] = [
  ...occupancyLevels,
  ...spikeResetLevels,
  ...movableGoalLevels,
  ...gateLevels,
];
