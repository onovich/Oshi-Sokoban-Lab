// Continuous, axis-separated sandbox movement. Deliberately independent of the game engine.
export const PLAYER_RADIUS = .48;
export const CRATE_HALF = .64;
export const SPAWN = { x: 0, z: 4 };
export const CRATE_SPAWNS = [{ x: 0, z: 1.8 }, { x: 2.6, z: -.8 }, { x: -2, z: -2.5 }];

export function circleHitsBox(p, box, radius = PLAYER_RADIUS) {
  const dx = Math.max(Math.abs(p.x - box.x) - box.hx, 0);
  const dz = Math.max(Math.abs(p.z - box.z) - box.hz, 0);
  return dx * dx + dz * dz < radius * radius - 1e-9;
}

export function boxesOverlap(a, b) {
  return Math.abs(a.x - b.x) < a.hx + b.hx - 1e-8 && Math.abs(a.z - b.z) < a.hz + b.hz - 1e-8;
}

export function makeWorld(collision) {
  return { player: { ...SPAWN }, crates: CRATE_SPAWNS.map(p => ({ ...p, hx: CRATE_HALF, hz: CRATE_HALF })), ...collision };
}

export function stepWorld(world, dx, dz) {
  let pushed = false;
  const before = { ...world.player };
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .045));
  for (let i = 0; i < count; i++) {
    for (const [axis, amount] of [['x', dx / count], ['z', dz / count]]) {
      if (!amount) continue;
      const p = { ...world.player, [axis]: world.player[axis] + amount };
      if (Math.abs(p.x) > world.bounds.x - PLAYER_RADIUS || Math.abs(p.z) > world.bounds.z - PLAYER_RADIUS) continue;
      if (world.obstacles.some(b => circleHitsBox(p, b))) continue;
      const contacts = world.crates.filter(b => circleHitsBox(p, b));
      if (contacts.length > 1) continue;
      if (contacts.length === 1) {
        const crate = contacts[0];
        const next = { ...crate, [axis]: crate[axis] + amount };
        if (Math.abs(next.x) + next.hx > world.bounds.x || Math.abs(next.z) + next.hz > world.bounds.z) continue;
        if (world.obstacles.some(b => boxesOverlap(next, b)) || world.crates.some(b => b !== crate && boxesOverlap(next, b))) continue;
        Object.assign(crate, next); pushed = true;
      }
      Object.assign(world.player, p);
    }
  }
  return { pushed, distance: Math.hypot(world.player.x - before.x, world.player.z - before.z) };
}

export function confineTarget(target, halfX, halfZ, offsets) {
  const minX = Math.min(...offsets.map(p => p.x)); const maxX = Math.max(...offsets.map(p => p.x));
  const minZ = Math.min(...offsets.map(p => p.z)); const maxZ = Math.max(...offsets.map(p => p.z));
  const lowX = -halfX - minX, highX = halfX - maxX;
  const lowZ = -halfZ - minZ, highZ = halfZ - maxZ;
  return {
    x: lowX > highX ? -(minX + maxX) / 2 : Math.max(lowX, Math.min(highX, target.x)),
    z: lowZ > highZ ? -(minZ + maxZ) / 2 : Math.max(lowZ, Math.min(highZ, target.z)),
    fits: lowX <= highX && lowZ <= highZ,
  };
}
