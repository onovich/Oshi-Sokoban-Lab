import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { bb1GoalWorkspace: spec } = await server.ssrLoadModule('/src/levels/lab/bb1-goal-workspace.ts');
  const { createGame, move, isBlockSolved } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { frozenLevelHash } = await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const dirs = ['up', 'right', 'down', 'left'];
  const key = cell => `${cell.x},${cell.y}`;
  // Exhaustive walk-state oracle delegates all push/cross behavior to move().
  // Constraints are broad spatial/history properties, not prescribed routes.
  function search(board, { noReverse = false, noOvershoot = false } = {}) {
    const initial = createGame(board), queue = [[initial, '', 0]], seen = new Set();
    const signature = (state, mask) => JSON.stringify([
      state.player, ...state.blocks.map(block => block.position), state.goals[0].position,
      noReverse ? mask : 0,
    ]);
    seen.add(signature(initial, 0));
    for (let i = 0; i < queue.length; i += 1) {
      if (queue.length > 22000) return { status: 'budget-exhausted', states: queue.length };
      const [state, path, mask] = queue[i];
      if (state.status === 'won') return { status: 'solved', path, states: queue.length };
      for (let d = 0; d < 4; d += 1) {
        const turn = move(state, dirs[d]);
        if (!turn.didMove) continue;
        const next = turn.state;
        if (noOvershoot && next.goals[0].position.x < 2) continue;
        const pushedGoal = turn.events.some(event => event.type === 'goal-pushed');
        const nextMask = mask | (pushedGoal ? 1 << d : 0);
        if (noReverse && ((nextMask & 5) === 5 || (nextMask & 10) === 10)) continue;
        const id = signature(next, nextMask);
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push([{ ...next, history: [] }, path + 'URDL'[d], nextMask]);
      }
    }
    return { status: 'proven-unsolved', states: queue.length };
  }
  const run = (name, board = spec.board, options = {}) => {
    const result = search(board, options);
    console.log(JSON.stringify({ name, ...result }));
    assert.notEqual(result.status, 'budget-exhausted');
    return result;
  };
  const replay = (route, board = spec.board) => {
    let state = createGame(board), crossings = 0, pushes = 0;
    for (const letter of route) {
      const turn = move(state, dirs['URDL'.indexOf(letter)]);
      assert.equal(turn.didMove, true);
      crossings += turn.events.filter(event => event.type === 'goal-crossed').length;
      pushes += turn.events.filter(event => event.type === 'goal-pushed' || event.type === 'block-pushed').length;
      state = turn.state;
    }
    return { state, crossings, pushes };
  };
  assert.ok(createGame(spec.board).blocks.every(block => !isBlockSolved(createGame(spec.board), block)));
  const base = run('base');
  assert.equal(base.status, 'solved');
  assert.equal(replay(base.path).state.status, 'won');
  assert.equal(run('no-Goal-direction-reversal', spec.board, { noReverse: true }).status, 'proven-unsolved');
  assert.equal(run('Goal-never-left-of-x2', spec.board, { noOvershoot: true }).status, 'proven-unsolved');
  for (const condition of spec.theorem.proofConditions) {
    assert.equal(solveLevel(spec, { maximumStates: 80000, maximumPlans: 1,
      forbiddenConditions: [condition] }).status, 'proven-unsolved');
  }
  for (const [route, crossings] of [['LLULDLRRUURD', 1], ['LLULLDRRUURD', 0]]) {
    const result = replay(route);
    assert.equal(result.state.status, 'won');
    assert.equal(result.crossings, crossings);
    assert.equal(result.pushes, 5);
  }
  const early = replay('LU').state;
  const earlyBoard = { ...spec.board, player: early.player, blocks: early.blocks, goals: early.goals };
  assert.equal(run('early-Block-push-LU', earlyBoard).status, 'proven-unsolved');
  const side = { ...spec.board, walls: spec.board.walls.filter(cell => cell.x !== 4 || cell.y !== 3) };
  assert.equal(side.walls.length, spec.board.walls.length - 1);
  for (const options of [{ noReverse: true }, { noOvershoot: true }, { noReverse: true, noOvershoot: true }]) {
    const result = run(`side-route:${JSON.stringify(options)}`, side, options);
    assert.equal(result.status, 'solved');
    assert.equal(replay(result.path, side).state.status, 'won');
  }
  assert.equal(solveLevel({ ...spec, board: side }, { maximumStates: 80000, maximumPlans: 1,
    forbiddenConditions: [{ kind: 'event', event: { key: 'event:goal-pushed' } }],
  }).status, 'solved');
  const excluded = new Set([key(spec.board.player), ...spec.board.walls.map(key),
    ...spec.board.blocks.map(block => key(block.position)), ...spec.board.goals.map(goal => key(goal.position))]);
  let tested = 0;
  for (let y = 0; y < spec.board.height; y += 1) for (let x = 0; x < spec.board.width; x += 1) {
    const cell = { x, y };
    if (excluded.has(key(cell))) continue;
    tested += 1;
    const mutation = { ...spec.board, walls: [...spec.board.walls, cell] };
    const result = run(`close-floor:${key(cell)}`, mutation);
    if (key(cell) === '0,1' || key(cell) === '3,3') {
      assert.equal(result.status, 'solved');
      assert.equal(run(`close-floor-without-overshoot:${key(cell)}`, mutation, { noOvershoot: true }).status, 'proven-unsolved');
      if (key(cell) === '3,3') {
        assert.equal(run('side-route-without-connector', { ...side, walls: [...side.walls, cell] }, { noOvershoot: true }).status, 'proven-unsolved');
      }
    } else assert.equal(result.status, 'proven-unsolved');
  }
  console.log(JSON.stringify({ hash: frozenLevelHash(spec), floorMutations: tested,
    limitations: ['D4 is uncalibrated.', 'A single short puzzle does not establish transfer.',
      'Goal crossing is optional; both equally short legal routes are retained.'] }));
} finally { await server.close(); }
