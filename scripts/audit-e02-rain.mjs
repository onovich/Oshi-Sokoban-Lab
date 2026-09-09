import { createServer } from 'vite';

// Read-only design probe. No catalog changes and no second implementation of movement.
// Run: node scripts/audit-e02-rain.mjs
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { e02Prototype: source } = await server.ssrLoadModule('/src/levels/lab/e02-experiment.ts');
  const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const options = { maximumStates: 80000, maximumPlans: 1 };
  const theorem = { ...source.theorem, proofConditions: [], milestones: [] };
  const dry = solveLevel({ ...source, theorem }, options);
  const variants = [
    { name: 'rain-only', walls: source.board.walls },
    ...source.board.walls.map((wall, index) => ({
      name: `open-${wall.x},${wall.y}`,
      walls: source.board.walls.filter((_, i) => i !== index),
    })),
  ];
  for (let i = 0; i < source.board.walls.length; i++) {
    for (let j = i + 1; j < source.board.walls.length; j++) {
      variants.push({ name: `open-pair-${i}-${j}`,
        walls: source.board.walls.filter((_, index) => index !== i && index !== j) });
    }
  }
  const occupied = [source.board.player, ...source.board.terrainGoals,
    ...source.board.blocks.flatMap(block => block.shape.map(offset => ({
      x: block.position.x + offset.x, y: block.position.y + offset.y,
    }))), ...source.board.walls];
  for (let y = 0; y < source.board.height; y++) {
    for (let x = 0; x < source.board.width; x++) {
      if (occupied.some(cell => cell.x === x && cell.y === y)) continue;
      variants.push({ name: `stop-${x},${y}`, walls: [...source.board.walls, { x, y }] });
    }
  }
  const pushSequence = report => report.bestPlan?.actions.filter(action => action.pushes).map(action => action.signature);
  console.log(JSON.stringify({ name: 'clear-baseline', status: dry.status,
    moves: dry.bestPlan?.moves, pushes: dry.bestPlan?.pushes, sequence: pushSequence(dry) }));
  for (const variant of variants) {
    const spec = { ...source, theorem, board: { ...source.board, weather: 'rain', walls: variant.walls } };
    const report = solveLevel(spec, options);
    let state = createGame(spec.board);
    for (const direction of report.bestPlan?.directions ?? []) {
      const result = move(state, direction);
      if (!result.didMove) throw new Error(`Invalid witness: ${variant.name}`);
      state = result.state;
    }
    if (report.status === 'solved' && state.status !== 'won') throw new Error('Witness did not win');
    console.log(JSON.stringify({ name: variant.name, status: report.status,
      explored: report.diagnostics.exploredStates, moves: report.bestPlan?.moves,
      pushes: report.bestPlan?.pushes, replayWon: state.status === 'won',
      sequence: pushSequence(report), directions: report.bestPlan?.directions }));
  }
} finally {
  await server.close();
}
