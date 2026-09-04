import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { acceptedFoundationCatalog } from '../course/course-catalog';
import { requestSolution } from './solution-request';

// Worker is the browser/transport boundary, not a substitute solver implementation.
class WorkerTransport {
  static instances: WorkerTransport[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminated = false;
  postMessage = vi.fn();
  terminate() { this.terminated = true; }
  constructor(readonly url: URL, readonly options: WorkerOptions) { WorkerTransport.instances.push(this); }
}

const spec = acceptedFoundationCatalog.levels[0]!;

beforeEach(() => {
  vi.useFakeTimers();
  WorkerTransport.instances = [];
  vi.stubGlobal('Worker', WorkerTransport);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('cancellable solution worker', () => {
  it('passes the current level to a module worker and disposes it after a result', async () => {
    const pending = requestSolution(spec, new AbortController().signal);
    const worker = WorkerTransport.instances[0]!;
    expect(worker.options).toEqual({ type: 'module' });
    expect(worker.postMessage).toHaveBeenCalledWith(spec);
    worker.onmessage!({ data: { status: 'solved', directions: ['right', 'right'] } });
    await expect(pending).resolves.toEqual({ status: 'solved', directions: ['right', 'right'] });
    expect(worker.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels both before and during a request without leaving search running', async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(requestSolution(spec, cancelled.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(WorkerTransport.instances).toHaveLength(0);
    const controller = new AbortController();
    const pending = requestSolution(spec, controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await rejected;
    expect(WorkerTransport.instances[0]!.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports wall-clock budget exhaustion as unknown, not unsolvable', async () => {
    const pending = requestSolution(spec, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(pending).resolves.toEqual({ status: 'budget-exhausted' });
    expect(WorkerTransport.instances[0]!.terminated).toBe(true);
  });

  it.each(['onerror', 'onmessageerror'] as const)('handles %s and releases resources', async (failure) => {
    const pending = requestSolution(spec, new AbortController().signal);
    WorkerTransport.instances[0]![failure]!();
    await expect(pending).resolves.toEqual({ status: 'error' });
    expect(WorkerTransport.instances[0]!.terminated).toBe(true);
  });

  it.each([null, { status: 'unknown' }, { status: 'solved', directions: ['diagonal'] }])('rejects malformed transport data %j', async (data) => {
    const pending = requestSolution(spec, new AbortController().signal);
    WorkerTransport.instances[0]!.onmessage!({ data });
    await expect(pending).resolves.toEqual({ status: 'error' });
  });

  it('fails safely when workers are unavailable', async () => {
    vi.stubGlobal('Worker', undefined);
    await expect(requestSolution(spec, new AbortController().signal)).resolves.toEqual({ status: 'error' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
