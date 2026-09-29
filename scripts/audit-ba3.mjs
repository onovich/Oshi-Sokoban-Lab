import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Mechanical evidence only: this does not calibrate human difficulty or learning.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { ba3TwoStageParking: spec } = await server.ssrLoadModule('/src/levels/lab/ba3-two-stage-parking.ts');
  const { createGame, move, isBlockSolved } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const options = { maximumStates: 80000, maximumPlans: 1, moveSlack: 0, pushSlack: 0 };
  const aId = `${spec.id}-a`;
  const key = cell => `${cell.x},${cell.y}`;
  const letters = { U: 'up', D: 'down', L: 'left', R: 'right' };
  const decode = route => [...route].map(letter => letters[letter]);
  const action = (from, to) => ({ kind: 'event', event: {
    key: `event:block-pushed:${aId}:from:${from}:to:${to}`,
  } });
  const departure = action('3,1', '3,2');
  // Independent, unpruned walk-state search: forbids loss of completion, not a coordinate.
  // It delegates every transition and solved predicate to the real engine.
  const forbidCompletedObjectDeparture = board => {
    const queue = [createGame(board)];
    const signature = state => [key(state.player), ...state.blocks.map(block => key(block.position))].join('|');
    const seen = new Set([signature(queue[0])]);
    for (let head = 0; head < queue.length; head += 1) {
      if (head >= 20000) return { status: 'budget-exhausted', states: head };
      const state = queue[head];
      if (state.status === 'won') return { status: 'solved', states: head + 1 };
      for (const direction of ['up', 'right', 'down', 'left']) {
        const turn = move(state, direction);
        if (!turn.didMove) continue;
        const leavesCompletedPosition = state.blocks.some(block =>
          isBlockSolved(state, block) && !isBlockSolved(turn.state,
            turn.state.blocks.find(candidate => candidate.id === block.id)));
        if (leavesCompletedPosition) continue;
        const id = signature(turn.state);
        if (!seen.has(id)) { seen.add(id); queue.push(turn.state); }
      }
    }
    return { status: 'proven-unsolved', states: queue.length };
  };
  const run = (name, candidate = spec, extra = {}) => {
    const report = solveLevel(candidate, { ...options, ...extra });
    console.log(JSON.stringify({ name, status: report.status,
      route: report.bestPlan?.directions.map(d => d[0].toUpperCase()).join(''),
      moves: report.bestPlan?.moves, pushes: report.bestPlan?.pushes,
      diagnostics: report.diagnostics }));
    assert.notEqual(report.status, 'budget-exhausted', 'Unknown is not a proof');
    return report;
  };
  const replay = (board, directions) => {
    let state = createGame(board);
    for (const direction of directions) {
      const turn = move(state, direction);
      assert.equal(turn.didMove, true, `Invalid replay input ${direction}`);
      state = turn.state;
    }
    return state;
  };
  const initial = createGame(spec.board);
  assert.ok(initial.blocks.every(block => !isBlockSolved(initial, block)));
  const base = run('base');
  assert.equal(base.status, 'solved');
  assert.equal(replay(spec.board, base.bestPlan.directions).status, 'won');
  const irreversibleCompletion = forbidCompletedObjectDeparture(spec.board);
  console.log(JSON.stringify({ name: 'no-completed-object-may-depart', ...irreversibleCompletion }));
  assert.equal(irreversibleCompletion.status, 'proven-unsolved');
  for (const [name, condition] of [
    ['without-opening', action('3,2', '3,1')],
    ['without-revoking-upper-parking', departure],
    ['without-lower-parking', action('3,3', '3,4')],
    ['without-ordered-handoff', spec.theorem.proofConditions[0]],
  ]) assert.equal(run(name, spec, { forbiddenConditions: [condition] }).status, 'proven-unsolved');

  const overshot = replay(spec.board, decode('RUU'));
  const overshotSpec = { ...spec, board: { ...spec.board, player: overshot.player,
    blocks: spec.board.blocks.map(block => ({ ...block,
      position: overshot.blocks.find(candidate => candidate.id === block.id).position })) } };
  assert.equal(run('overshot-first-parking', overshotSpec).status, 'proven-unsolved');

  const added = new Set(['1,4', '1,5']);
  const contrast = { ...spec, board: { ...spec.board,
    walls: spec.board.walls.filter(cell => !added.has(key(cell))) } };
  assert.equal(contrast.board.walls.length, spec.board.walls.length - 2);
  const decoupled = run('lower-route-turning-bay', contrast, { forbiddenConditions: [departure] });
  assert.equal(decoupled.status, 'solved');
  assert.equal(replay(contrast.board, decoupled.bestPlan.directions).status, 'won');
  const contrastCompletion = forbidCompletedObjectDeparture(contrast.board);
  console.log(JSON.stringify({ name: 'contrast-without-completed-departure', ...contrastCompletion }));
  assert.equal(contrastCompletion.status, 'solved');

  const excluded = new Set([key(spec.board.player), ...spec.board.walls.map(key),
    ...spec.board.terrainGoals.map(key), ...spec.board.blocks.flatMap(block => block.shape.map(part =>
      key({ x: block.position.x + part.x, y: block.position.y + part.y }))) ]);
  const deletions = [];
  for (let y = 0; y < spec.board.height; y += 1) {
    for (let x = 0; x < spec.board.width; x += 1) {
      const cell = { x, y };
      if (excluded.has(key(cell))) continue;
      const mutation = { ...spec, board: { ...spec.board, walls: [...spec.board.walls, cell] } };
      const result = run(`close-floor:${key(cell)}`, mutation);
      deletions.push([key(cell), result.status]);
      if (key(cell) === '4,3') {
        // Closing the shorter direct B route forces a lower-route detour.
        assert.equal(result.status, 'solved');
        assert.ok(result.bestPlan.pushes > base.bestPlan.pushes);
        assert.equal(run('close-4,3-without-handoff', mutation, {
          forbiddenConditions: spec.theorem.proofConditions,
        }).status, 'proven-unsolved');
      } else if (key(cell) === '6,2') {
        // Allows the plausible lower B route to be tried. It also ensures the
        // contrast changes only its left turning bay, not B's initial push side.
        assert.equal(result.status, 'solved');
        const blockedContrast = { ...contrast, board: { ...contrast.board,
          walls: [...contrast.board.walls, cell] } };
        assert.equal(run('contrast-without-B-downward-push-side', blockedContrast, {
          forbiddenConditions: [departure],
        }).status, 'proven-unsolved');
      } else assert.equal(result.status, 'proven-unsolved');
    }
  }
  for (const block of spec.board.blocks) {
    const mutation = { ...spec, board: { ...spec.board,
      blocks: spec.board.blocks.filter(candidate => candidate.id !== block.id) } };
    const result = run(`remove-object:${block.id}`, mutation);
    assert.equal(result.status, 'solved');
    assert.ok(result.bestPlan.pushes < base.bestPlan.pushes);
  }
  console.log(JSON.stringify({ deletions, limitations: [
    'A starts with two of three cells covered, but neither complete object is initially solved.',
    'The first opening is forced; D6 is uncalibrated and may overestimate the experience.',
    'No human insight milestone is inferred from a fixed engine event.',
    'Single-cell deletion is local mutation evidence, not globally minimal geometry.',
  ] }));
} finally { await server.close(); }
