import type { LevelSpec } from '../course/types';
import type { Direction } from '../engine/types';

export type SolutionResult =
  | Readonly<{ status: 'solved'; directions: readonly Direction[] }>
  | Readonly<{ status: 'proven-unsolved' | 'budget-exhausted' | 'error' }>;

export type SolutionLoader = (spec: LevelSpec, signal: AbortSignal) => Promise<SolutionResult>;

function isSolutionResult(value: unknown): value is SolutionResult {
  if (!value || typeof value !== 'object' || !('status' in value)) return false;
  if (value.status !== 'solved') {
    return value.status === 'proven-unsolved' || value.status === 'budget-exhausted' || value.status === 'error';
  }
  return 'directions' in value && Array.isArray(value.directions) && value.directions.length <= 10_000
    && value.directions.every((direction: unknown) =>
      direction === 'up' || direction === 'down' || direction === 'left' || direction === 'right');
}

/** A cancellable worker keeps search off the input/animation thread. */
export const requestSolution: SolutionLoader = (spec, signal) => new Promise((resolve, reject) => {
  if (signal.aborted) {
    reject(new DOMException('Solution request cancelled', 'AbortError'));
    return;
  }

  let worker: Worker;
  try {
    worker = new Worker(new URL('./solution.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    resolve({ status: 'error' });
    return;
  }

  const cleanup = () => {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
    worker.terminate();
  };
  const finish = (result: SolutionResult) => {
    cleanup();
    resolve(result);
  };
  const abort = () => {
    cleanup();
    reject(new DOMException('Solution request cancelled', 'AbortError'));
  };
  const timeout = setTimeout(() => finish({ status: 'budget-exhausted' }), 20_000);
  signal.addEventListener('abort', abort, { once: true });
  worker.onmessage = (event: MessageEvent<unknown>) =>
    finish(isSolutionResult(event.data) ? event.data : { status: 'error' });
  worker.onerror = () => finish({ status: 'error' });
  worker.onmessageerror = () => finish({ status: 'error' });
  try {
    worker.postMessage(spec);
  } catch {
    finish({ status: 'error' });
  }
});
