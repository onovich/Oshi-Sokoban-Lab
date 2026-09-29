import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Exploration evidence only: deliberately not registered as a course level.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const c = (x, y) => ({ x, y });
  const directions = ['up', 'right', 'down', 'left'];
  const offsets = [c(0, -1), c(1, 0), c(0, 1), c(-1, 0)];
  const board = {
    id: 'candidate-rain-goal-stages', title: '', width: 5, height: 4,
    weather: 'rain', player: c(3, 3), walls: [c(4, 2), c(2, 3), c(4, 3)],
    terrainGoals: [], terrainSpikes: [],
    blocks: [{ id: 'b', position: c(2, 2), shape: [c(0, 0)], number: 0, isFake: false }],
    goals: [{ id: 'g', position: c(3, 1), shape: [c(0, 0)], number: 0, movable: true }],
    gates: [], spikes: [], paths: [],
  };
  function search(definition, ban) {
    const initial = createGame(definition);
    const key = (s, pending, used) => JSON.stringify([s.player, s.blocks[0].position, s.goals[0].position, pending, used]);
    const queue = [[initial, '', false, false]];
    const seen = new Set([key(initial, false, false)]);
    for (let index = 0; index < queue.length; index++) {
      if (queue.length > 15000) return { status: 'budget-exhausted', states: queue.length };
      const [state, route, pending, used] = queue[index];
      if (state.status === 'won') return { status: 'solved', route, states: queue.length };
      for (let d = 0; d < 4; d++) {
        const turn = move(state, directions[d]);
        if (!turn.didMove) continue;
        const blockMoved = turn.events.some(e => e.type === 'block-pushed');
        const goalMoved = turn.events.some(e => e.type === 'goal-pushed');
        const supported = pending && blockMoved;
        if (ban === 'support' && supported) continue;
        if (ban === 'goal-after-support' && used && goalMoved) continue;
        const next = turn.state;
        const goal = next.goals[0].position;
        // Previous non-pushing movement ended directly against G in its travel direction.
        // This relation includes one-cell stopping moves, which emit no rain-slid event.
        const nextPending = !blockMoved && !goalMoved
          && next.player.x + offsets[d].x === goal.x
          && next.player.y + offsets[d].y === goal.y;
        const nextUsed = used || supported;
        const fingerprint = key(next, nextPending, nextUsed);
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);
        queue.push([{ ...next, history: [] }, route + 'URDL'[d], nextPending, nextUsed]);
      }
    }
    return { status: 'proven-unsolved', states: queue.length };
  }
  const baseline = search(board);
  const noSupport = search(board, 'support');
  const noReuse = search(board, 'goal-after-support');
  const clear = search({ ...board, weather: 'clear' }, 'support');
  assert.equal(baseline.status, 'solved');
  assert.equal(noSupport.status, 'proven-unsolved');
  assert.equal(noReuse.status, 'proven-unsolved');
  assert.equal(clear.status, 'solved');
  let replay = createGame(board);
  for (const letter of baseline.route) {
    const turn = move(replay, directions['URDL'.indexOf(letter)]);
    assert.ok(turn.didMove);
    replay = turn.state;
  }
  assert.equal(replay.status, 'won');
  const preparationVariant = {
    ...board, height: 5, player: c(1, 1),
    walls: [c(4, 2), c(0, 4), c(2, 4)],
    goals: [{ ...board.goals[0], position: c(2, 1) }],
  };
  const preparationBypass = search(preparationVariant, 'support');
  assert.equal(preparationBypass.status, 'solved');
  console.log(JSON.stringify({ decision: 'hold: basic relation only; preparation bypassed',
    baseline, noSupport, noReuse, clear, preparationBypass }, null, 2));
} finally {
  await server.close();
}
