import type { GateDefinition } from '../engine/types';

/** Visible identity follows links, never a gate's current position or array adjacency. */
export function gatePairLabels(gates: readonly GateDefinition[]): ReadonlyMap<string, string> {
  const byId = new Map(gates.map(gate => [gate.id, gate]));
  const pairs = new Map<string, readonly string[]>();
  for (const gate of gates) {
    if (!gate.nextGateId) return new Map();
    const other = byId.get(gate.nextGateId);
    if (!other || other.nextGateId !== gate.id || other.id === gate.id) return new Map();
    const members = [gate.id, other.id].sort();
    pairs.set(JSON.stringify(members), members);
  }
  if (pairs.size < 2) return new Map();
  return new Map([...pairs.entries()].sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, members], index) => members.map(id => [id, String.fromCharCode(65 + index)] as const)));
}
