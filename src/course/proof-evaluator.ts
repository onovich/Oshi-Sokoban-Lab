import type { DomainEvent } from '../engine/types';
import { proofConditionKey } from './proof-condition';
import type { ProofCondition } from './types';

export type ProofConditionEvaluation = Readonly<{
  condition: ProofCondition;
  key: string;
  satisfied: boolean;
  actionIndex?: number;
  pushesAtCompletion?: number;
}>;

export type ProofEventBatch = Readonly<{
  events: readonly DomainEvent[];
  pushes: number;
}>;

export function eventKeys(event: DomainEvent): readonly string[] {
  const keys = [`event:${event.type}`];
  if ('entityId' in event) keys.push(`event:${event.type}:${event.entityId}`);
  if (event.type === 'object-reset') {
    keys.push(`event:${event.type}:${event.entityType}`);
    keys.push(`event:${event.type}:${event.entityType}:${event.entityId}`);
  }
  if (event.type === 'gate-traversed') {
    keys.push(`event:${event.type}:entry:${event.entryGateId}`);
    keys.push(`event:${event.type}:exit:${event.exitGateId}`);
  }
  if ('direction' in event) keys.push(`event:${event.type}:${event.direction}`);
  if ('from' in event && 'to' in event) {
    const transition = `from:${event.from.x},${event.from.y}:to:${event.to.x},${event.to.y}`;
    keys.push(`event:${event.type}:${transition}`);
    if ('entityId' in event) keys.push(`event:${event.type}:${event.entityId}:${transition}`);
  }
  return keys;
}

export function proofTarget(condition: ProofCondition): number {
  if (condition.kind === 'count') return condition.atLeast;
  if (condition.kind === 'sequence') return condition.events.length;
  return 1;
}

export function advanceProof(
  condition: ProofCondition,
  progress: number,
  events: readonly DomainEvent[],
): number {
  const target = proofTarget(condition);
  if (progress >= target) return target;
  if (condition.kind === 'event') {
    return events.some((event) => eventKeys(event).includes(condition.event.key)) ? 1 : progress;
  }
  if (condition.kind === 'count') {
    const matches = events.filter((event) => eventKeys(event).includes(condition.event.key)).length;
    return Math.min(condition.atLeast, progress + matches);
  }

  let next = progress;
  for (const event of events) {
    const expected = condition.events[next];
    if (expected && eventKeys(event).includes(expected.key)) next += 1;
    if (next >= target) break;
  }
  return next;
}

export function proofSatisfied(condition: ProofCondition, progress: number): boolean {
  return progress >= proofTarget(condition);
}

export function evaluateProofConditions(
  conditions: readonly ProofCondition[],
  batches: readonly ProofEventBatch[],
): readonly ProofConditionEvaluation[] {
  const progresses = conditions.map(() => 0);
  const completions: Array<Readonly<{ actionIndex: number; pushesAtCompletion: number }> | undefined> =
    conditions.map(() => undefined);
  let pushes = 0;

  batches.forEach((batch, actionIndex) => {
    pushes += batch.pushes;
    conditions.forEach((condition, index) => {
      if (completions[index]) return;
      progresses[index] = advanceProof(condition, progresses[index]!, batch.events);
      if (proofSatisfied(condition, progresses[index]!)) {
        completions[index] = { actionIndex, pushesAtCompletion: pushes };
      }
    });
  });

  return conditions.map((condition, index) => ({
    condition,
    key: proofConditionKey(condition),
    satisfied: proofSatisfied(condition, progresses[index]!),
    ...completions[index],
  }));
}

/**
 * Milestones are a curriculum narrative, not an unordered checklist. Only the
 * next milestone can advance; later events cannot silently satisfy it early.
 */
export function evaluateOrderedMilestones(
  conditions: readonly ProofCondition[],
  batches: readonly ProofEventBatch[],
): readonly ProofConditionEvaluation[] {
  const evaluations: ProofConditionEvaluation[] = conditions.map((condition) => ({
    condition,
    key: proofConditionKey(condition),
    satisfied: false,
  }));
  let current = 0;
  let progress = 0;
  let pushes = 0;

  batches.forEach((batch, actionIndex) => {
    pushes += batch.pushes;
    const condition = conditions[current];
    if (!condition) return;
    progress = advanceProof(condition, progress, batch.events);
    if (!proofSatisfied(condition, progress)) return;
    evaluations[current] = {
      condition,
      key: proofConditionKey(condition),
      satisfied: true,
      actionIndex,
      pushesAtCompletion: pushes,
    };
    current += 1;
    progress = 0;
  });

  return evaluations;
}
