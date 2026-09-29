import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
 const { bc1OffsetBank: spec } = await server.ssrLoadModule('/src/levels/lab/bc1-offset-bank.ts');
 const { rainSelfStop } = await server.ssrLoadModule('/src/levels/lab/rs10-rain-self-stop.ts');
 const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
 const { solveLevel } = await server.ssrLoadModule('/src/solver/level-solver.ts');
 const dirs = ['up', 'right', 'down', 'left'], offsets = [[0,-1],[1,0],[0,1],[-1,0]];
 // Exact finite single-block positional graph; transitions always use move().
 const search = (board, forbidStop = false, forbidBelowGoal = false) => {
  const initial = createGame(board), q = [[initial, '']];
  const key = s => JSON.stringify([s.player, s.blocks[0].position]);
  const seen = new Set([key(initial)]);
  for (let i = 0; i < q.length; i++) {
   assert.ok(q.length <= 625, 'Unexpected state budget; result is unknown');
   const [state, route] = q[i];
   if (state.status === 'won') return { status: 'solved', route, states: q.length };
   for (let d = 0; d < 4; d++) {
    const result = move(state, dirs[d]), next = result.state;
    const b = state.blocks[0].position, n = next.blocks[0].position;
    if (!result.didMove || (forbidBelowGoal && n.y > 2)) continue;
    if (forbidStop && b.x === n.x && b.y === n.y && next.player.x + offsets[d][0] === b.x && next.player.y + offsets[d][1] === b.y) continue;
    const k = key(next); if (seen.has(k)) continue;
    seen.add(k); q.push([{ ...next, history: [] }, route + 'URDL'[d]]);
   }
  }
  return { status: 'proven-unsolved', states: q.length };
 };
 const run = (name, board = spec.board, stop = false, below = false) => {
  const report = search(board, stop, below); console.log(JSON.stringify({ name, ...report })); return report;
 };
 assert.equal(run('base').status, 'solved');
 assert.equal(run('without-any-block-supported-approach', spec.board, true).status, 'proven-unsolved');
 assert.equal(run('never-below-goal-row', spec.board, false, true).status, 'proven-unsolved');
 assert.equal(solveLevel(spec, { maximumStates: 5000, maximumPlans: 1, forbiddenConditions: spec.theorem.proofConditions }).status, 'proven-unsolved');
 const contrast = { ...spec.board, walls: [...spec.board.walls, { x: 4, y: 1 }] };
 assert.equal(run('static-stop-without-either-relation', contrast, true, true).status, 'solved');
 const reference = solveLevel(rainSelfStop, { maximumStates: 5000, maximumPlans: 1 });
 let transferred = createGame(spec.board);
 for (const direction of reference.bestPlan.directions) transferred = move(transferred, direction).state;
 assert.notEqual(transferred.status, 'won');
 console.log(JSON.stringify({ name: 'reference-route-not-a-solution', route: reference.bestPlan.directions, result: transferred.status }));
 for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
  const cell = {x,y};
  if ([...spec.board.walls, spec.board.player, spec.board.blocks[0].position, ...spec.board.terrainGoals].some(p => p.x === x && p.y === y)) continue;
  const board = { ...spec.board, walls: [...spec.board.walls, cell] };
  run(`close:${x},${y}`, board);
  run(`close:${x},${y}:without-stop`, board, true);
  run(`close:${x},${y}:without-below`, board, false, true);
  run(`close:${x},${y}:without-both`, board, true, true);
 }
} finally { await server.close(); }
