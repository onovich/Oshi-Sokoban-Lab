import { createServer } from 'vite';

// Candidate pool only. Search metrics filter work; they do not rate human difficulty.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { e02Prototype: source } = await server.ssrLoadModule('/src/levels/lab/e02-experiment.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const cells = Array.from({ length: 25 }, (_, i) => ({ x: i % 5, y: Math.floor(i / 5) }));
  const key = p => `${p.x},${p.y}`;
  const occupied = (block, position) => block.shape.map(p => ({ x: p.x + position.x, y: p.y + position.y }));
  const legal = points => points.every(p => p.x < 5 && p.y < 5 &&
    !source.board.walls.some(w => key(w) === key(p)) && key(p) !== key(source.board.player));
  let tested = 0, solved = 0, unknown = 0;
  for (const a of cells) for (const b of cells) {
    const ac = occupied(source.board.blocks[0], a), bc = occupied(source.board.blocks[1], b);
    if (!legal(ac) || !legal(bc) || ac.some(p => bc.some(q => key(p) === key(q)))) continue;
    const spec = { ...source, board: { ...source.board, weather: 'rain',
      blocks: source.board.blocks.map((block, i) => ({ ...block, position: i ? b : a })) },
      theorem: { ...source.theorem, proofConditions: [], milestones: [] } };
    const report = solveLevel(spec, { maximumStates: 15000, maximumPlans: 1 });
    tested++;
    if (report.status === 'budget-exhausted') unknown++;
    if (report.status !== 'solved') continue;
    solved++;
    if (report.bestPlan.pushes < 10) continue;
    console.log(JSON.stringify({ a, b, moves: report.bestPlan.moves, pushes: report.bestPlan.pushes,
      directions: report.bestPlan.directions,
      sequence: report.bestPlan.actions.filter(action => action.pushes).map(action => action.signature) }));
  }
  console.log(JSON.stringify({ tested, solved, unknown }));
  // A distinct structural family: two rigid shapes plus one task block, new starts and targets.
  let seed = 20260909;
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 4294967296 * n); };
  let candidates = 0;
  const shapes = [...source.board.blocks, { ...source.board.blocks[0], id: 'probe-c', shape: [{ x: 0, y: 0 }] }];
  let searched = 0, randomSolved = 0, randomUnknown = 0;
  for (let attempt = 0; attempt < 20000 && candidates < 6; attempt++) {
    const positions = shapes.map(() => cells[random(25)]);
    const targets = shapes.map(() => cells[random(25)]);
    const startCells = positions.flatMap((p, i) => occupied(shapes[i], p));
    const goalCells = targets.flatMap((p, i) => occupied(shapes[i], p));
    if ([...startCells, ...goalCells].some(p => p.x >= 5 || p.y >= 5) ||
      new Set(startCells.map(key)).size !== 5 || new Set(goalCells.map(key)).size !== 5) continue;
    const player = cells[random(25)];
    if (startCells.some(p => key(p) === key(player))) continue;
    const available = cells.filter(p => ![...startCells, ...goalCells, player].some(q => key(q) === key(p)));
    const walls = [];
    for (let i = 0; i < 4 && available.length; i++) walls.push(available.splice(random(available.length), 1)[0]);
    const spec = { ...source, board: { ...source.board, weather: 'rain', player, walls,
      terrainGoals: goalCells, blocks: shapes.map((block, i) => ({ ...block, position: positions[i] })) },
      theorem: { ...source.theorem, proofConditions: [], milestones: [] } };
    const report = solveLevel(spec, { maximumStates: 15000, maximumPlans: 1 });
    searched++;
    if (report.status === 'solved') randomSolved++;
    if (report.status === 'budget-exhausted') randomUnknown++;
    if (report.status !== 'solved' || report.bestPlan.pushes < 10) continue;
    candidates++;
    console.log(JSON.stringify({ attempt, positions, targets, player, walls,
      moves: report.bestPlan.moves, pushes: report.bestPlan.pushes,
      directions: report.bestPlan.directions,
      sequence: report.bestPlan.actions.filter(action => action.pushes).map(action => action.signature) }));
  }
  console.log(JSON.stringify({ searched, randomSolved, randomUnknown, candidates }));
} finally { await server.close(); }
