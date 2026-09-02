import type { LevelDefinition } from '../engine/types';
import { courseLevels } from './course-catalog';

/**
 * The playable curriculum is deliberately composed at the family boundary.
 * Add a future family in its own module, then place it here to define the
 * teaching order without mixing its map data into unrelated mechanics.
 */
export const demoLevels: readonly LevelDefinition[] = [
  ...courseLevels.map((level) => level.board),
];
