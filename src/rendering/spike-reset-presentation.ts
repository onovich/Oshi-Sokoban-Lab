import type { DomainEvent } from '../engine/types';

export const SPIKE_RESET_TIMING = Object.freeze({
  ingressMs: 180,
  impactStartMs: 180,
  impactMs: 280,
  respawnStartMs: 460,
  respawnMs: 360,
  totalMs: 820,
  reducedMotionTotalMs: 80,
});

export const SPIKE_RESET_WINDOWS = Object.freeze({
  ingress: '0-180ms',
  impact: '180-460ms',
  respawn: '460-820ms',
});

export function hasObjectReset(events: readonly DomainEvent[] | undefined): boolean {
  return events?.some((event) => event.type === 'object-reset') ?? false;
}
