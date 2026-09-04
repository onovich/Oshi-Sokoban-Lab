import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { masteryV2Catalog } from '../course/course-catalog';
import { DifficultySummary } from './DifficultySummary';

afterEach(cleanup);

it.each([
  ['lab-e06-small-court', 4], ['lab-e06-independent-return', 5], ['lab-e06-interleaved', 6],
] as const)('distinguishes %s author rating from stranger calibration', (id, rating) => {
  const difficulty = masteryV2Catalog.labLevels.find((level) => level.id === id)!.difficulty;
  render(<DifficultySummary difficulty={difficulty} />);
  expect(screen.getByText(new RegExp(`作者 D${rating}`)).textContent).toContain('陌生玩家尚未校准');
  expect(difficulty.sampleSize).toBe(0);
  expect(difficulty.observed).toBeUndefined();
});
