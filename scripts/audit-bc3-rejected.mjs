import assert from 'node:assert/strict';
import { createServer } from 'vite';

// A replayable counterexample, not a production level or a new movement model.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { createGame, move } = await server.ssrLoadModule('/src/engine/game-engine.ts');
  const c = (x, y) => ({ x, y });
  const board = {
    id: 'rejected-bc3', title: '', description: '', objective: '',
    width: 5, height: 5, weather: 'rain', player: c(0, 1),
    walls: [c(3, 0), c(4, 0), c(4, 4)], terrainGoals: [c(0, 4), c(1, 2)],
    terrainSpikes: [], blocks: [c(2, 3), c(3, 2)].map((position, index) => ({
      id: ['a', 'b'][index], position, shape: [c(0, 0)], number: 0, isFake: false,
    })), goals: [], gates: [], spikes: [], paths: [],
  };
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const directions = { U: ['up', c(0, -1)], R: ['right', c(1, 0)], D: ['down', c(0, 1)], L: ['left', c(-1, 0)] };
  const replay = route => {
    let state = createGame(board), pending = -1;
    const supports = [];
    for (const letter of route) {
      const [direction, offset] = directions[letter];
      const turn = move(state, direction);
      assert.equal(turn.didMove, true);
      const pushed = state.blocks.findIndex((block, index) => !same(block.position, turn.state.blocks[index].position));
      if (pending >= 0 && pushed >= 0 && pending !== pushed) supports.push(`${pending}->${pushed}`);
      pending = pushed < 0 ? turn.state.blocks.findIndex(block => same(block.position,
        c(turn.state.player.x + offset.x, turn.state.player.y + offset.y))) : -1;
      state = turn.state;
    }
    assert.equal(state.status, 'won');
    return { route, moves: state.moves, supports };
  };
  const intended = replay('RDLURULLLRDLLULDDDURDLU');
  const bypass = replay('RDLLDRUURULLLULDDDURDLU');
  assert.equal(new Set(intended.supports).size, 2);
  assert.ok(new Set(bypass.supports).size < 2);
  assert.equal(bypass.moves, intended.moves);
  console.log(JSON.stringify({ decision: 'reject: mutual support is bypassable', intended, bypass }));
} finally { await server.close(); }
