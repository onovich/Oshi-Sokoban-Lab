import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Mechanical evidence; neither a blind player test nor a difficulty rating.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { ba2SharedBay: spec } = await server.ssrLoadModule('/src/levels/lab/ba2-shared-bay.ts');
  const { createGame, move, isBlockSolved } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const options = { maximumStates: 80000, maximumPlans: 1, moveSlack: 0, pushSlack: 0 };
  const aId = `${spec.id}-a`, bId = `${spec.id}-b`;
  const letters = { U: 'up', D: 'down', L: 'left', R: 'right' };
  const decode = route => [...route].map(letter => letters[letter]);
  const event = (id, from, to) => ({ key: `event:block-pushed:${id}${from ? `:from:${from}:to:${to}` : ''}` });
  const depart = { kind: 'event', event: event(aId, '4,3', '4,4') };
  const recover = { kind: 'event', event: event(aId, '4,4', '4,3') };
  const handoff = { kind: 'sequence', events: [depart.event, event(bId), recover.event] };
  const replay = (board, directions, forbiddenFootprint) => {
    let state = createGame(board);
    for (const direction of directions) {
      const result = move(state, direction);
      assert.equal(result.didMove, true, `Invalid replay input ${direction}`);
      state = result.state;
      if (forbiddenFootprint) {
        assert.ok(state.blocks.every(block => block.shape.every(part =>
          block.position.x + part.x !== forbiddenFootprint.x ||
          block.position.y + part.y !== forbiddenFootprint.y)),
        'The contrast must use the added cell only for walking');
      }
    }
    return state;
  };
  const run = (name, candidate = spec, extra = {}) => {
    const report = solveLevel(candidate, { ...options, ...extra });
    console.log(JSON.stringify({ name, status: report.status,
      route: report.bestPlan?.directions.map(d => d[0].toUpperCase()).join(''),
      moves: report.bestPlan?.moves, pushes: report.bestPlan?.pushes,
      diagnostics: report.diagnostics }));
    assert.notEqual(report.status, 'budget-exhausted');
    return report;
  };
  const fromState = state => ({ ...spec, board: { ...spec.board, player: state.player,
    blocks: spec.board.blocks.map(block => ({ ...block,
      position: state.blocks.find(candidate => candidate.id === block.id).position })) } });
  const initial = createGame(spec.board);
  assert.ok(initial.blocks.every(block => !isBlockSolved(initial, block)), 'Both tasks start unfinished');
  const base = run('base');
  assert.equal(base.status, 'solved');
  assert.equal(replay(spec.board, base.bestPlan.directions).status, 'won');
  for (const [name, condition] of [['without-departure', depart], ['without-return', recover], ['without-handoff', handoff]]) {
    assert.equal(run(name, spec, { forbiddenConditions: [condition] }).status, 'proven-unsolved');
  }

  // This actual reachable prefix finishes B while A still needs its sole return side.
  const bad = replay(spec.board, decode('DDLLULDDLDRRR'));
  assert.equal(isBlockSolved(bad, bad.blocks.find(block => block.id === bId)), true);
  assert.equal(isBlockSolved(bad, bad.blocks.find(block => block.id === aId)), false);
  assert.equal(run('B-completed-before-A-return', fromState(bad)).status, 'proven-unsolved');

  // A successful alternative explicitly refutes a prescribed intermediate B coordinate.
  const latePrefix = 'DDLLULDD';
  const late = replay(spec.board, decode(latePrefix));
  assert.deepEqual(late.blocks.find(block => block.id === bId).position, { x: 1, y: 5 });
  assert.equal(isBlockSolved(late, late.blocks.find(block => block.id === aId)), false);
  const alternative = run('B-can-reach-1,5-before-A-return', fromState(late));
  assert.equal(alternative.status, 'solved');
  assert.equal(replay(spec.board, [...decode(latePrefix), ...alternative.bestPlan.directions]).status, 'won');

  const addedCell = { x: 3, y: 2 };
  const contrast = { ...spec, board: { ...spec.board,
    walls: spec.board.walls.filter(cell => cell.x !== addedCell.x || cell.y !== addedCell.y) } };
  assert.equal(contrast.board.walls.length, spec.board.walls.length - 1);
  const decoupled = run('second-walking-route-without-A-departure', contrast, { forbiddenConditions: [depart] });
  assert.equal(decoupled.status, 'solved');
  assert.equal(replay(contrast.board, decoupled.bestPlan.directions, addedCell).status, 'won');

  // One-at-a-time floor deletion, excluding initially occupied and goal cells.
  const key = point => `${point.x},${point.y}`;
  const excluded = new Set([key(spec.board.player), ...spec.board.walls.map(key),
    ...spec.board.terrainGoals.map(key), ...spec.board.blocks.flatMap(block => block.shape.map(part =>
      key({ x: block.position.x + part.x, y: block.position.y + part.y }))) ]);
  let checked = 0;
  for (let y = 0; y < spec.board.height; y += 1) {
    for (let x = 0; x < spec.board.width; x += 1) {
      const cell = { x, y };
      if (excluded.has(key(cell))) continue;
      const mutation = { ...spec, board: { ...spec.board, walls: [...spec.board.walls, cell] } };
      assert.equal(run(`close-floor:${key(cell)}`, mutation).status, 'proven-unsolved');
      checked += 1;
    }
  }
  console.log(JSON.stringify({ freeFloorDeletionsChecked: checked, limitations: [
    'D5 remains a design target; opening pushes are forced and may feel easier.',
    'The required relation does not prescribe a specific intermediate B coordinate.',
    'Floor deletion is a local irredundancy check, not a proof of globally minimal geometry.',
    'No new-context AI-player or human playtest has been performed by this audit.',
  ] }));
} finally {
  await server.close();
}
