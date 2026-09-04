import type { LevelSpec } from '../course/types';
import { findDemoSolution } from './solution-search';
import type { SolutionResult } from './solution-request';

self.onmessage = (event: MessageEvent<LevelSpec>) => {
  let result: SolutionResult;
  try {
    result = findDemoSolution(event.data);
  } catch {
    result = { status: 'error' };
  }
  self.postMessage(result);
};
