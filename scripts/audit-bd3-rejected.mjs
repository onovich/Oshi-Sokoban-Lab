import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const c = (x, y) => ({ x, y });
  const base = '2,0 3,0 2,1 3,1 1,2 2,2 3,2 1,3 3,3 1,4 2,4 3,4 5,1 6,1 7,1 5,2 6,2 7,2 5,3';
  function board(extra) {
    const floor = new Set(`${base} ${extra}`.trim().split(' '));
    return { id: 'rejected-bd3', title: '', description: '', objective: '', width: 8, height: 5,
      weather: 'clear', player: c(3, 1),
      walls: Array.from({ length: 40 }, (_, i) => c(i % 8, Math.floor(i / 8))).filter(p => !floor.has(`${p.x},${p.y}`)),
      blocks: [c(6,2), c(2,2)].map((position, i) => ({ id: i ? 'c' : 'b', position, shape: [c(0,0)], number: 0, isFake: false })),
      terrainGoals: [c(5,3), c(3,2)], terrainSpikes: [], goals: [], spikes: [], paths: [],
      gates: [{ id: 'entry', position: c(2,1), shape: [c(0,0)], nextGateId: 'exit' },
        { id: 'exit', position: c(6,1), shape: [c(0,0)], nextGateId: 'entry' }] };
  }
  const leavesGoal = events => events.some(e => e.type === 'block-pushed' && e.entityId === 'c' && e.from.x === 3 && e.from.y === 2);
  function search(definition, forbid = false) {
    const start = createGame(definition), queue = [start];
    const key = s => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
    const seen = new Set([key(start)]);
    for (let i = 0; i < queue.length; i++) {
      assert.ok(queue.length <= 80000, 'budget exhausted: UNKNOWN, not unsolved');
      const state = queue[i];
      if (state.status === 'won') return { status: 'solved', states: queue.length };
      for (const direction of ['up', 'right', 'down', 'left']) {
        const result = move(state, direction);
        if (!result.didMove || (forbid && leavesGoal(result.events))) continue;
        const signature = key(result.state);
        if (seen.has(signature)) continue;
        seen.add(signature); queue.push({ ...result.state, history: [] });
      }
    }
    return { status: 'proven-unsolved', states: queue.length };
  }
  const first = search(board('')), second = search(board('0,0 1,0 0,1 0,2'), true), third = search(board('5,0 6,0'));
  assert.equal(first.status, 'proven-unsolved');
  assert.equal(second.status, 'solved');
  assert.equal(third.status, 'proven-unsolved');
  let state = createGame(board('0,0 1,0 0,1 0,2'));
  for (const input of 'ULLLDDRRUDLLUURRDLRULLDDRRURULD') {
    const result = move(state, { U: 'up', R: 'right', D: 'down', L: 'left' }[input]);
    assert.ok(result.didMove); assert.equal(leavesGoal(result.events), false); state = result.state;
  }
  assert.equal(state.status, 'won');
  console.log(JSON.stringify({ decision: 'reject all three as return-scheduling candidates', first, second, third }));
} finally { await server.close(); }
