import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { bd3ControlledEntry: spec } = await server.ssrLoadModule('/src/levels/lab/bd3-controlled-entry.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { frozenLevelHash } = await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const options = { maximumStates: 20000, maximumPlans: 1 };
  const solved = solveLevel(spec, options);
  assert.equal(solved.status, 'solved');
  let state = createGame(spec.board);
  const events = [];
  for (const direction of solved.bestPlan.directions) {
    const turn = move(state, direction);
    assert.ok(turn.didMove);
    events.push(...turn.events);
    state = turn.state;
  }
  assert.equal(state.status, 'won');
  const forbidden = solveLevel(spec, { ...options, forbiddenConditions: spec.theorem.proofConditions });
  assert.equal(forbidden.status, 'proven-unsolved');
  console.log(JSON.stringify({ hash: frozenLevelHash(spec), directions: solved.bestPlan.directions,
    moves: solved.bestPlan.moves, pushes: solved.bestPlan.pushes, forbidden: forbidden.status, events }, null, 2));
} finally { await server.close(); }
