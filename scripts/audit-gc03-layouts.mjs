import { createServer } from 'vite';

// Research-only probes: never imports candidates into a playable catalog.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { gc01GoalReturn: source } = await server.ssrLoadModule('/src/levels/lab/gc01-goal-return.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const key = ({ x, y }) => `${x},${y}`;
  const occupied = [source.board.player, ...source.board.blocks.map(b => b.position),
    ...source.board.goals.map(g => g.position), ...source.board.terrainGoals].map(key);
  const cells = Array.from({ length: 20 }, (_,i) => ({ x: i % 5, y: Math.floor(i / 5) }));
  const free = cells.filter(p => !occupied.includes(key(p)) &&
    !source.board.walls.some(w => key(w) === key(p)));
  const layouts = [];
  // Family A: remove at most two original walls, add at most one empty-cell wall.
  for (let mask = 0; mask < 32; mask++) {
    if (mask.toString(2).replaceAll('0', '').length > 2) continue;
    for (const add of [null, ...free]) {
      layouts.push([...source.board.walls.filter((_, i) => !(mask & (1 << i))), ...(add ? [add] : [])]);
    }
  }
  // Family B: remove at most one original wall, add two; keep the old corner open.
  const secondFamily = free.filter(p => key(p) !== '0,3');
  for (let remove = -1; remove < 5; remove++) {
    for (let i = 0; i < secondFamily.length; i++) {
      for (let j = i + 1; j < secondFamily.length; j++) {
        layouts.push([...source.board.walls.filter((_, k) => k !== remove), secondFamily[i], secondFamily[j]]);
      }
    }
  }
  const options = { maximumStates: 20000, maximumPlans: 1 };
  const summary = { tested: 0, solved: 0, unsolved: 0, unknown: 0,
    oldPreparationLegal: 0, oldPreparationStillSolvable: 0, oldPreparationDead: 0,
    continuationUnknown: 0, withdrawalBypass: 0, withdrawalNecessary: 0, withdrawalUnknown: 0,
    remainingGoalBypass: 0, remainingGoalNecessary: 0, remainingGoalUnknown: 0 };
  const candidates = [];
  const forbidWithdrawal = [{ x: 3, y: 1 }, { x: 4, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 2 }]
    .map(p => ({ kind: 'event', event: {
      key: `event:block-pushed:${source.board.blocks[0].id}:from:3,2:to:${key(p)}`,
    } }));
  for (const walls of layouts) {
    const spec = { ...source, board: { ...source.board, walls },
      theorem: { ...source.theorem, proofConditions: [], milestones: [] } };
    summary.tested++;
    const report = solveLevel(spec, options);
    if (report.status !== 'solved') {
      summary[report.status === 'budget-exhausted' ? 'unknown' : 'unsolved']++;
      continue;
    }
    summary.solved++;
    let state = createGame(spec.board);
    let legal = true;
    for (const direction of ['right', 'right', 'left', 'left', 'up', 'down']) {
      const result = move(state, direction);
      legal &&= result.didMove;
      state = result.state;
    }
    if (!legal || key(state.goals[0].position) !== '0,3') continue;
    summary.oldPreparationLegal++;
    const continuation = solveLevel({ ...spec, board: { ...spec.board,
      player: state.player, blocks: state.blocks, goals: state.goals } }, options);
    if (continuation.status !== 'proven-unsolved') {
      summary[continuation.status === 'solved' ? 'oldPreparationStillSolvable' : 'continuationUnknown']++;
      continue;
    }
    summary.oldPreparationDead++;
    const bypass = solveLevel(spec, { ...options, forbiddenConditions: forbidWithdrawal });
    summary[bypass.status === 'solved' ? 'withdrawalBypass' :
      bypass.status === 'proven-unsolved' ? 'withdrawalNecessary' : 'withdrawalUnknown']++;
    let goalCheck;
    if (bypass.status === 'proven-unsolved') {
      goalCheck = solveLevel(spec, { ...options,
        forbiddenConditions: [{ kind: 'event', event: { key: 'event:goal-pushed' } }],
      });
      summary[goalCheck.status === 'solved' ? 'remainingGoalBypass' :
        goalCheck.status === 'proven-unsolved' ? 'remainingGoalNecessary' : 'remainingGoalUnknown']++;
    }
    candidates.push({ walls, moves: report.bestPlan.moves, pushes: report.bestPlan.pushes,
      withdrawalCheck: bypass.status,
      goalCheck: goalCheck?.status,
      witness: (bypass.bestPlan ?? report.bestPlan).actions.filter(a => a.pushes).map(a => a.signature) });
  }
  console.log(JSON.stringify({ summary, candidates }, null, 2));
} finally {
  await server.close();
}
