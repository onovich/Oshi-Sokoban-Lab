import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { rs01RainStaging: spec } = await server.ssrLoadModule('/src/levels/lab/rs01-rain-staging.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { auditLevelMutations } = await server.ssrLoadModule('/src/levels/level-mutation-audit.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const options = { maximumStates: 80000, maximumPlans: 1 };
  const rain = solveLevel(spec, options);
  const window = solveLevel(spec, { ...options, maximumPlans: 3, pushSlack: 2, moveSlack: 8 });
  console.log(JSON.stringify({ windowStatus: window.status, complete: window.diagnostics.completePlanWindow,
    plans: window.plans.length, strategies: new Set(window.plans.map(plan => plan.coreSignature)).size,
    moves: rain.bestPlan.moves, pushes: rain.bestPlan.pushes, tail: rain.proof.insightTailPushes }));
  let state = createGame(spec.board), index = 0;
  for (const direction of rain.bestPlan.directions) {
    const result = move(state, direction);
    console.log(JSON.stringify({ step: ++index, direction, from: state.player, to: result.state.player,
      events: result.events }));
    state = result.state;
  }
  for (const condition of spec.theorem.proofConditions) {
    const dry = solveLevel({ ...spec, board: { ...spec.board, weather: 'clear' } },
      { ...options, forbiddenConditions: [condition] });
    console.log(JSON.stringify({ dryWithout: condition, status: dry.status, pushes: dry.bestPlan?.pushes }));
  }
  console.log(JSON.stringify({ audit: auditLevelMutations(spec, 80000) }));
} finally { await server.close(); }
