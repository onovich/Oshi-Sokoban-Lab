import type { ProofCondition, ProofEventKey, ProofEventPattern } from './types';

function eventPattern(value: string): ProofEventPattern {
  if (!value.startsWith('event:')) throw new Error(`Invalid event proof key "${value}".`);
  return { key: value as ProofEventKey };
}

export function proofConditionFromLegacy(value: string): ProofCondition {
  const count = /^event-count:(\d+):(event:.+)$/.exec(value);
  if (count) {
    const atLeast = Number(count[1]);
    if (!Number.isSafeInteger(atLeast) || atLeast < 1) {
      throw new Error(`Invalid event-count proof "${value}".`);
    }
    return { kind: 'count', event: eventPattern(count[2]!), atLeast };
  }

  if (value.startsWith('event-sequence:')) {
    const events = value.slice('event-sequence:'.length).split('>').filter(Boolean).map(eventPattern);
    if (events.length < 2) throw new Error(`Invalid event-sequence proof "${value}".`);
    return { kind: 'sequence', events };
  }

  return { kind: 'event', event: eventPattern(value) };
}

export function proofConditionKey(condition: ProofCondition): string {
  if (condition.kind === 'event') return condition.event.key;
  if (condition.kind === 'count') {
    return `event-count:${condition.atLeast}:${condition.event.key}`;
  }
  return `event-sequence:${condition.events.map((event) => event.key).join('>')}`;
}

export function rewriteProofCondition(
  condition: ProofCondition,
  rewrite: (value: string) => string,
): ProofCondition {
  return proofConditionFromLegacy(rewrite(proofConditionKey(condition)));
}

