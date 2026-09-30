import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { h2Clearance: spec } = await server.ssrLoadModule('/src/levels/lab/h2-clearance.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { frozenLevelHash } = await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const options = { maximumStates: 30000, maximumPlans: 1 };
  const solved = solveLevel(spec, options);
  assert.equal(solved.status, 'solved');
  let state = createGame(spec.board);
  for (const letter of 'DRDRULUURRURD') {
    const turn = move(state, { R: 'right', L: 'left', U: 'up', D: 'down' }[letter]);
    assert.ok(turn.didMove);
    assert.ok(!turn.events.some(e => e.type === 'object-reset' || e.type === 'death-reset'));
    state = turn.state;
  }
  assert.equal(state.status, 'won');
  let played = createGame(spec.board);
  for (const letter of 'RDDRULURRUURD') {
    const turn = move(played, { R: 'right', L: 'left', U: 'up', D: 'down' }[letter]);
    assert.ok(turn.didMove);
    assert.ok(!turn.events.some(e => e.type === 'object-reset' || e.type === 'death-reset'));
    played = turn.state;
  }
  assert.equal(played.status, 'won');
  const forbidden = solveLevel(spec, { ...options, forbiddenConditions: spec.theorem.proofConditions });
  assert.equal(forbidden.status, 'proven-unsolved');
  console.log(JSON.stringify({ hash: frozenLevelHash(spec), moves: solved.bestPlan.moves,
    pushes: solved.bestPlan.pushes, forbidden: forbidden.status }, null, 2));
} finally { await server.close(); }
