import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { bb2GoalPermission: spec } = await server.ssrLoadModule('/src/levels/lab/bb2-goal-permission.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { frozenLevelHash } = await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const options = { maximumStates: 20000, maximumPlans: 4, moveSlack: 2, pushSlack: 1 };
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
  const prohibited = spec.theorem.proofConditions.map(condition => {
    const result = solveLevel(spec, { ...options, maximumPlans: 1, forbiddenConditions: [condition] });
    assert.equal(result.status, 'proven-unsolved');
    return { condition, status: result.status };
  });
  console.log(JSON.stringify({ hash: frozenLevelHash(spec), status: solved.status,
    bestPlan: solved.bestPlan, prohibited, events }, null, 2));
} finally { await server.close(); }
