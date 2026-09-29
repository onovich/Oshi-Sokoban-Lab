import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { bd1DirectionChoice: spec } = await server.ssrLoadModule('/src/levels/lab/bd1-direction-choice.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { frozenLevelHash } = await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const dirs = ['up', 'right', 'down', 'left'];
  const key = c => `${c.x},${c.y}`;
  const signature = s => JSON.stringify([s.player, ...s.blocks.map(b => b.position), ...s.gates.map(g => g.position)]);
  function search(board, bannedEntryDirection) {
    const initial = createGame(board), queue = [[initial, '']], seen = new Set([signature(initial)]);
    for (let i = 0; i < queue.length; i += 1) {
      if (queue.length > 20000) return { status: 'budget-exhausted', states: queue.length };
      const [state, path] = queue[i];
      if (state.status === 'won') return { status: 'solved', path, states: queue.length };
      for (let d = 0; d < dirs.length; d += 1) {
        const turn = move(state, dirs[d]);
        if (!turn.didMove) continue;
        if (turn.events.some(e => e.type === 'gate-traversed' && e.entryGateId === `${spec.id}-entry`
          && e.direction === bannedEntryDirection)) continue;
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
    let state = createGame(board), pushes = 0;
    for (const letter of route) {
      const turn = move(state, dirs['URDL'.indexOf(letter)]);
      assert.equal(turn.didMove, true);
      pushes += turn.events.filter(e => e.type === 'block-pushed').length;
      state = turn.state;
    }
    return { state, pushes };
  }
  assert.equal(createGame(spec.board).status, 'playing');
  const base = run('base');
  assert.equal(base.status, 'solved');
  assert.equal(replay('ULLDRDLURDLD').state.status, 'won');
  assert.equal(replay('ULLDRDLURDLD').pushes, 2);
  for (const direction of ['left', 'right']) {
    assert.equal(run(`ban-entry-${direction}`, spec.board, direction).status, 'proven-unsolved');
  }
  // Public proof keys ban a direction at any gate, while the oracle above narrows
  // the event to the named entry. Neither bans ordinary directional walking.
  for (const condition of spec.theorem.proofConditions) {
    assert.equal(solveLevel(spec, { maximumStates: 20000, maximumPlans: 1,
      forbiddenConditions: [condition] }).status, 'proven-unsolved');
  }
  assert.equal(signature(replay('LR').state), signature(createGame(spec.board)));
  const wrong = replay('LDR').state;
  assert.equal(run('nearest-entry-wrong-push-LDR', { ...spec.board,
    player: wrong.player, blocks: wrong.blocks, gates: wrong.gates }).status, 'proven-unsolved');
  const side = { ...spec.board, walls: spec.board.walls.filter(c => key(c) !== '5,3') };
  const contrast = run('independent-side-route-without-entry-right', side, 'right');
  assert.equal(contrast.status, 'solved');
  assert.equal(replay(contrast.path, side).state.status, 'won');
  const excluded = new Set([key(spec.board.player), ...spec.board.walls.map(key),
    ...spec.board.blocks.map(b => key(b.position)), ...spec.board.gates.map(g => key(g.position)),
    ...spec.board.terrainGoals.map(key)]);
  const mutations = [];
  for (let y = 0; y < spec.board.height; y += 1) for (let x = 0; x < spec.board.width; x += 1) {
    const cell = { x, y };
    if (excluded.has(key(cell))) continue;
    const board = { ...spec.board, walls: [...spec.board.walls, cell] };
    const result = run(`close-floor:${key(cell)}`, board);
    mutations.push({ cell: key(cell), ...result });
    const retained = ['0,0', '1,0', '2,0', '0,2', '1,2', '2,2', '6,3'].includes(key(cell));
    assert.equal(result.status, retained ? 'solved' : 'proven-unsolved');
    if (result.status === 'solved') {
      for (const direction of ['left', 'right']) assert.equal(search(board, direction).status, 'proven-unsolved');
      assert.ok(spec.theorem.readabilityElements.includes(`cell:${key(cell)}`));
    }
    if (key(cell) === '6,3') assert.equal(search({ ...side, walls: [...side.walls, cell] }, 'right').status, 'proven-unsolved');
  }
  assert.equal(mutations.length, 12);
  console.log(JSON.stringify({ hash: frozenLevelHash(spec), mutations,
    limitation: 'Target D4 is uncalibrated; rule discovery is not evidence of learned-technique transfer.' }));
} finally { await server.close(); }
