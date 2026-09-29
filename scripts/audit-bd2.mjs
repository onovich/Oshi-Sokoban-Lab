import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { bd2ShiftedEntry: spec } = await server.ssrLoadModule('/src/levels/lab/bd2-shifted-entry.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { frozenLevelHash } = await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const dirs = ['up', 'right', 'down', 'left'], entry = `${spec.id}-entry`;
  const key = c => `${c.x},${c.y}`;
  const signature = s => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  const bans = {
    noGatePush: events => events.some(e => e.type === 'gate-pushed'),
    noEntryDown: events => events.some(e => e.type === 'gate-pushed' && e.entityId === entry && e.to.y > e.from.y),
    noEntryRight: events => events.some(e => e.type === 'gate-traversed' && e.entryGateId === entry && e.direction === 'right'),
    noEntryLeft: events => events.some(e => e.type === 'gate-traversed' && e.entryGateId === entry && e.direction === 'left'),
  };
  // Every successor uses the engine. Gates remain movable; no fixed topology is assumed.
  function search(board, ban) {
    const initial = createGame(board), queue = [[initial, '']], seen = new Set([signature(initial)]);
    for (let i = 0; i < queue.length; i += 1) {
      if (queue.length > 20000) return { status: 'budget-exhausted', states: queue.length };
      const [state, path] = queue[i];
      if (state.status === 'won') return { status: 'solved', path, states: queue.length };
      for (let d = 0; d < dirs.length; d += 1) {
        const turn = move(state, dirs[d]);
        if (!turn.didMove || ban?.(turn.events)) continue;
        const id = signature(turn.state);
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push([{ ...turn.state, history: [] }, path + 'URDL'[d]]);
      }
    }
    return { status: 'proven-unsolved', states: queue.length };
  }
  const run = (name, board = spec.board, ban) => {
    const result = search(board, ban);
    assert.notEqual(result.status, 'budget-exhausted');
    console.log(JSON.stringify({ name, ...result }));
    return result;
  };
  function replay(route, board = spec.board) {
    let state = createGame(board), gatePushes = 0, blockPushes = 0;
    for (const letter of route) {
      const turn = move(state, dirs['URDL'.indexOf(letter)]);
      assert.equal(turn.didMove, true);
      gatePushes += turn.events.filter(e => e.type === 'gate-pushed').length;
      blockPushes += turn.events.filter(e => e.type === 'block-pushed').length;
      state = turn.state;
    }
    return { state, gatePushes, blockPushes };
  }
  assert.equal(createGame(spec.board).status, 'playing');
  const base = run('base');
  assert.equal(base.status, 'solved');
  assert.equal(base.path.length, 14);
  const shortest = replay('ULDDLDRDLURDLD');
  assert.equal(shortest.state.status, 'won');
  assert.equal(shortest.gatePushes, 2);
  assert.equal(shortest.blockPushes, 2);
  // This alternative prevents falsely teaching "push the gate twice" as necessary.
  const once = replay('ULDRDDLLURDLURDLD');
  assert.equal(once.state.status, 'won');
  assert.equal(once.gatePushes, 1);
  assert.equal(once.blockPushes, 2);
  for (const [name, ban] of Object.entries(bans)) assert.equal(run(name, spec.board, ban).status, 'proven-unsolved');
  assert.equal(solveLevel(spec, { maximumStates: 20000, maximumPlans: 1,
    forbiddenConditions: spec.theorem.proofConditions }).status, 'proven-unsolved');
  const before = replay('UL').state;
  const blocked = move(before, 'down');
  assert.ok(blocked.events.some(e => e.type === 'gate-pushed' && e.entityId === entry));
  assert.ok(!blocked.events.some(e => e.type === 'gate-traversed'));
  const cleared = { ...before, blocks: before.blocks.map(b => ({ ...b, position: { x: 4, y: 2 } })) };
  const traversed = move(cleared, 'down');
  assert.ok(traversed.events.some(e => e.type === 'gate-traversed' && e.entryGateId === entry));
  assert.ok(!traversed.events.some(e => e.type === 'gate-pushed'));
  assert.deepEqual(traversed.state.player, { x: 5, y: 2 });
  const wrong = replay('LDR').state;
  assert.equal(run('nearest-entry-wrong-push-LDR', { ...spec.board,
    player: wrong.player, blocks: wrong.blocks, gates: wrong.gates }).status, 'proven-unsolved');
  const side = { ...spec.board, walls: spec.board.walls.filter(c => key(c) !== '0,1') };
  assert.equal(side.walls.length, spec.board.walls.length - 1);
  const contrast = run('independent-standing-cell-noGatePush', side, bans.noGatePush);
  assert.equal(contrast.status, 'solved');
  assert.equal(replay(contrast.path, side).state.status, 'won');
  assert.equal(replay(contrast.path, side).gatePushes, 0);
  const excluded = new Set([key(spec.board.player), ...spec.board.walls.map(key),
    ...spec.board.blocks.map(b => key(b.position)), ...spec.board.gates.map(g => key(g.position)),
    ...spec.board.terrainGoals.map(key)]);
  let mutations = 0;
  for (let y = 0; y < spec.board.height; y += 1) for (let x = 0; x < spec.board.width; x += 1) {
    const cell = { x, y };
    if (excluded.has(key(cell))) continue;
    mutations += 1;
    assert.equal(run(`close-floor:${key(cell)}`, { ...spec.board, walls: [...spec.board.walls, cell] }).status, 'proven-unsolved');
  }
  assert.equal(mutations, 12);
  console.log(JSON.stringify({ hash: frozenLevelHash(spec), floorMutations: mutations,
    limitation: 'Existing blockage is exploited, not actively manufactured. Target D5 uncalibrated; one gate push suffices.' }));
} finally { await server.close(); }
