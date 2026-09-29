import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { bc2BorrowedStop: spec } = await server.ssrLoadModule('/src/levels/lab/bc2-borrowed-stop.ts');
  const { createGame, move, isBlockSolved } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const directions = ['up', 'right', 'down', 'left'], offsets = [[0,-1], [1,0], [0,1], [-1,0]];
  const replay = (route, board = spec.board) => {
    let state = createGame(board);
    for (const letter of route) {
      const result = move(state, directions['URDL'.indexOf(letter)]);
      assert.equal(result.didMove, true, `Blocked replay input ${letter}`);
      state = result.state;
    }
    return state;
  };
  const search = (board, forbidSupport = false) => {
    const initial = createGame(board), queue = [[initial, false, '']];
    const key = (s, pending) => JSON.stringify([s.player, ...s.blocks.map(b => b.position), pending]);
    const seen = new Set([key(initial, false)]);
    for (let i = 0; i < queue.length; i++) {
      if (queue.length > 16000) return { status: 'budget-exhausted', states: queue.length };
      const [state, pending, route] = queue[i];
      if (state.status === 'won') return { status: 'solved', states: queue.length, route };
      for (let d = 0; d < 4; d++) {
        const result = move(state, directions[d]), next = result.state;
        if (!result.didMove) continue;
        const changed = index => state.blocks[index].position.x !== next.blocks[index].position.x
          || state.blocks[index].position.y !== next.blocks[index].position.y;
        if (forbidSupport && pending && changed(1)) continue;
        const a = next.blocks[0].position;
        // Only the immediately preceding no-push approach counts; includes one-cell approaches.
        const nextPending = !changed(0) && !changed(1)
          && next.player.x + offsets[d][0] === a.x && next.player.y + offsets[d][1] === a.y;
        const signature = key(next, nextPending);
        if (seen.has(signature)) continue;
        seen.add(signature); queue.push([{ ...next, history: [] }, nextPending, route + 'URDL'[d]]);
      }
    }
    return { status: 'proven-unsolved', states: queue.length };
  };
  const run = (name, board = spec.board, forbidden = false) => {
    const result = search(board, forbidden); console.log(JSON.stringify({ name, ...result }));
    assert.notEqual(result.status, 'budget-exhausted'); return result;
  };
  const base = run('base');
  assert.equal(base.status, 'solved');
  assert.equal(replay(base.route).status, 'won');
  assert.ok(createGame(spec.board).blocks.every(block => !isBlockSolved(createGame(spec.board), block)));
  const options = { maximumStates: 20000, maximumPlans: 1 };
  const solver = solveLevel(spec, options);
  assert.equal(solver.status, 'solved');
  console.log(JSON.stringify({ name: 'solver', moves: solver.bestPlan.moves, pushes: solver.bestPlan.pushes }));
  assert.equal(solveLevel(spec, { ...options, forbiddenConditions: spec.theorem.proofConditions }).status, 'proven-unsolved');
  assert.equal(run('without-A-stop-immediately-serving-B', spec.board, true).status, 'proven-unsolved');
  const early = replay('DRRDRU');
  const earlyBoard = { ...spec.board, player: early.player,
    blocks: spec.board.blocks.map((block, i) => ({ ...block, position: early.blocks[i].position })) };
  assert.equal(run('A-finished-before-serving-B', earlyBoard).status, 'proven-unsolved');
  for (const route of ['DRRDRDLURULRULURDD', 'DRRDRDLURULULURDDRU']) {
    assert.equal(replay(route).status, 'won');
    console.log(JSON.stringify({ name: 'valid-finishing-order', route }));
  }
  const before = replay('DRRDRDLUR');
  assert.deepEqual(move(before, 'up').state.player, { x: 3, y: 2 });
  assert.deepEqual(move({ ...before, blocks: [before.blocks[1]] }, 'up').state.player, { x: 3, y: 0 });
  const contrast = { ...spec.board, walls: [...spec.board.walls, { x: 3, y: 4 }] };
  assert.equal(run('static-stop-no-A-support', contrast, true).status, 'solved');
  let closed = 0;
  for (let y = 0; y < spec.board.height; y++) for (let x = 0; x < spec.board.width; x++) {
    if ([...spec.board.walls, spec.board.player, ...spec.board.terrainGoals, ...spec.board.blocks.map(b => b.position)]
      .some(cell => cell.x === x && cell.y === y)) continue;
    const board = { ...spec.board, walls: [...spec.board.walls, { x, y }] };
    if (x === 3 && y === 4) assert.equal(run(`close:${x},${y}:no-support`, board, true).status, 'solved');
    else assert.equal(run(`close:${x},${y}`, board).status, 'proven-unsolved');
    closed++;
  }
  assert.equal(closed, 10);
  console.log(JSON.stringify({ localFloorMutations: closed, limitations: [
    'The final order of A and B is not prescribed; either can finish first after support.',
    'A moving after support is not by itself proof of a deeper resource handoff.',
    'Target D5 is uncalibrated; input count does not establish difficulty.',
    'No live player test or stable learning claim is made by this audit.',
  ] }));
} finally { await server.close(); }
