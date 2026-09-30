import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Reproducible mechanical evidence only; this is not a player acceptance test.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { ba1ReturnPassage: spec } = await server.ssrLoadModule('/src/levels/lab/ba1-return-passage.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { createGame, move, isBlockSolved } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const { auditLevelMutations } = await server.ssrLoadModule('/src/levels/level-mutation-audit.ts');
  const options = { maximumStates: 80000, maximumPlans: 1, moveSlack: 0, pushSlack: 0 };
  const condition = (from, to) => ({ kind: 'event', event: {
    key: `event:block-pushed:${spec.id}-a:from:${from}:to:${to}`,
  } });
  const replay = (board, directions) => {
    let state = createGame(board);
    for (const direction of directions) {
      const result = move(state, direction);
      assert.equal(result.didMove, true, `Invalid replay input: ${direction}`);
      state = result.state;
    }
    return state;
  };
  const run = (name, candidate, extra = {}) => {
    const report = solveLevel(candidate, { ...options, ...extra });
    console.log(JSON.stringify({ name, status: report.status,
      route: report.bestPlan?.directions.map(d => d[0].toUpperCase()).join(''),
      moves: report.bestPlan?.moves, pushes: report.bestPlan?.pushes,
      diagnostics: report.diagnostics }));
    assert.notEqual(report.status, 'budget-exhausted');
    return report;
  };
  const initial = createGame(spec.board);
  assert.ok(initial.blocks.every(block => !isBlockSolved(initial, block)), 'Every task starts unfinished');
  const base = run('base', spec);
  assert.equal(base.status, 'solved');
  assert.equal(replay(spec.board, base.bestPlan.directions).status, 'won');
  const reviewDirections = [...'RURRRUULDRDLLLLRRRUUULLDDD'].map(letter =>
    ({ R: 'right', U: 'up', L: 'left', D: 'down' })[letter]);
  const reviewed = replay(spec.board, reviewDirections);
  assert.equal(reviewed.status, 'won');
  assert.equal(reviewed.moves, 26);
  for (const [name, forbidden] of [
    ['without-opening', condition('3,3', '3,2')],
    ['without-middle-return', condition('3,2', '3,3')],
  ]) {
    assert.equal(run(name, spec, { forbiddenConditions: [forbidden] }).status, 'proven-unsolved');
  }

  const mistakenPrefix = ['right', 'up', 'up'];
  const badState = replay(spec.board, mistakenPrefix);
  assert.deepEqual(badState.blocks.find(b => b.id === `${spec.id}-a`).position, { x: 3, y: 1 });
  const bad = { ...spec, board: { ...spec.board, player: badState.player,
    blocks: spec.board.blocks.map(block => ({ ...block,
      position: badState.blocks.find(b => b.id === block.id).position })) } };
  assert.equal(run('deep-parking', bad).status, 'proven-unsolved');
  const contrastBoard = { ...spec.board,
    walls: spec.board.walls.filter(cell => cell.x !== 3 || cell.y !== 0) };
  assert.equal(contrastBoard.walls.length, spec.board.walls.length - 1);
  const continuation = run('deep-parking-with-return-cell', {
    ...bad, board: { ...bad.board, walls: contrastBoard.walls },
  });
  assert.equal(continuation.status, 'solved');
  const fullContrast = replay(contrastBoard, [...mistakenPrefix, ...continuation.bestPlan.directions]);
  assert.equal(fullContrast.status, 'won');
  console.log(JSON.stringify({ name: 'contrast-from-original-start', status: fullContrast.status,
    moves: fullContrast.moves }));
  console.log(JSON.stringify({ name: 'mutations', results: auditLevelMutations(spec, 80000) }));
  console.log(JSON.stringify({ limitations: [
    'No AI-player or human difficulty acceptance.',
    'The first opening push is forced; D4 may be too high.',
    'B completion before A is not asserted necessary.',
    'Mutation labels are mechanical classifications, not difficulty evidence.',
  ] }));
} finally {
  await server.close();
}
