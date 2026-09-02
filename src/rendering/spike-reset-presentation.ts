import type { DomainEvent } from '../engine/types';

export const SPIKE_RESET_TIMING = Object.freeze({
  ingressMs: 180,
  impactStartMs: 180,
  impactMs: 120,
  respawnStartMs: 300,
  respawnMs: 320,
  totalMs: 620,
  reducedMotionTotalMs: 80,
});

export function hasObjectReset(events: readonly DomainEvent[] | undefined): boolean {
  return events?.some((event) => event.type === 'object-reset') ?? false;
}
