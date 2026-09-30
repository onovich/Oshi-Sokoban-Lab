import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { h2Clearance } from './h2-clearance';

const directions = ['up', 'right', 'down', 'left'] as const;
type State = ReturnType<typeof createGame>;
type Result = ReturnType<typeof move>;
function replay(route: string, state = createGame(h2Clearance.board)) {
  for (const letter of route) {
    const result = move(state, directions['URDL'.indexOf(letter)]!);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  return state;
}

type Node = { state: State; inputs: number; pushes: number };
// This static clear-weather board only has player and fixed-shape Block positions as mutable rule state.
// All edges use move(). Dijkstra compares either (inputs,pushes) or (pushes,inputs).
function search(board = h2Clearance.board, ban?: (before: State, result: Result) => boolean, pushesFirst = false) {
  const queue: Node[] = [{ state: createGame(board), inputs: 0, pushes: 0 }], seen = new Set<string>();
  while (queue.length) {
    queue.sort((a,b) => pushesFirst ? a.pushes - b.pushes || a.inputs - b.inputs
      : a.inputs - b.inputs || a.pushes - b.pushes);
    const node = queue.shift()!;
    const signature = JSON.stringify([node.state.player, ...node.state.blocks.map(b => b.position)]);
    if (seen.has(signature)) continue;
    seen.add(signature);
    if (seen.size > 30000) throw new Error('Budget exhausted: unknown, not unsolved');
    if (node.state.status === 'won') return { inputs: node.inputs, pushes: node.pushes };
    for (const direction of directions) {
      const result = move(node.state, direction);
      if (!result.didMove || ban?.(node.state, result)) continue;
      queue.push({ state: { ...result.state, history: [] }, inputs: node.inputs + 1,
        pushes: node.pushes + result.events.filter(e => e.type === 'block-pushed').length });
    }
  }
  return null;
}
const reset = (_s: State, r: Result) => r.events.some(e => e.type === 'object-reset' || e.type === 'death-reset');
const withoutSpike = { ...h2Clearance.board, terrainSpikes: [] };


it('transports the whole shape without resets', () => {
  expect(replay('DRDRULUURRURD').status).toBe('won');
});

it('reset improves neither input nor pushing optimum, while removing Spike gives a shortcut', () => {
  for (const pushesFirst of [false, true]) {
    expect(search(h2Clearance.board, undefined, pushesFirst)).toEqual({ inputs: 13, pushes: 5 });
    expect(search(h2Clearance.board, reset, pushesFirst)).toEqual({ inputs: 13, pushes: 5 });
    expect(search(withoutSpike, undefined, pushesFirst)).toEqual({ inputs: 3, pushes: 3 });
  }
});

it('lifting is necessary for the complete shape, but not for its anchor cell alone', () => {
  const noLift = (_s: State, r: Result) => r.state.blocks[0]!.position.y < 2;
  expect(search(h2Clearance.board, noLift)).toBeNull();
  expect(search(withoutSpike, noLift)).toEqual({ inputs: 3, pushes: 3 });
  // Only change the shape, retaining both Goals, Spike, and all terrain.
  const anchorOnly = { ...h2Clearance.board, blocks: h2Clearance.board.blocks.map(b => ({ ...b, shape: [{ x: 0, y: 0 }] })) };
  expect(search(anchorOnly, noLift)).toEqual({ inputs: 3, pushes: 3 });
  expect(search(anchorOnly, reset)).toEqual({ inputs: 3, pushes: 3 });
  expect(replay('RRR', createGame(anchorOnly)).status).toBe('won');
});

it('the remote lower cell really resets the whole advanced shape, not a blocked proposed move', () => {
  const staged = replay('R');
  expect(staged.blocks[0]!.position).toEqual({ x: 2, y: 2 });
  const result = move(staged, 'right');
  expect(result.didMove).toBe(true);
  expect(result.events).toContainEqual(expect.objectContaining({ type: 'object-reset',
    entityId: `${h2Clearance.id}-a`, from: { x: 3, y: 2 }, to: { x: 1, y: 2 },
    contactCells: [{ x: 3, y: 3 }] }));
  expect(result.state.player).toEqual({ x: 2, y: 2 });
  expect(result.state.blocks[0]!.position).toEqual({ x: 1, y: 2 });
  // The lost forward placement was recoverable without touching Spike.
  expect(replay('DDRULUURRURD', staged).status).toBe('won');
});

it('keeps upper and lower constituent contact choices, not mandatory shortest-path cells', () => {
  const upper = replay('R'), lower = replay('DR');
  expect(upper.blocks[0]!.position).toEqual(lower.blocks[0]!.position);
  expect(upper.player).toEqual({ x: 1, y: 2 });
  expect(lower.player).toEqual({ x: 1, y: 3 });
  const noLowerApproach = { ...h2Clearance.board, walls: [...h2Clearance.board.walls, { x: 0, y: 3 }] };
  expect(replay('RDDRULUURRURD', createGame(noLowerApproach)).status).toBe('won');
  const noUpperApproach = { ...h2Clearance.board, walls: [...h2Clearance.board.walls, { x: 1, y: 1 }] };
  expect(replay('DRDRULURURURD', createGame(noUpperApproach)).status).toBe('won');
});

it('all unmarked ordinary transport cells are necessary under individual sealing', () => {
  for (const [x,y] of [[3,0],[4,0],[2,1],[3,1],[4,1],[2,2],[3,2],[2,3],[1,4],[2,4]]) {
    expect(search({ ...h2Clearance.board, walls: [...h2Clearance.board.walls, { x:x!, y:y! }] })).toBeNull();
  }
});

it('the pre-goal transport event is necessary independently of the full-state no-lift test', () => {
  const report = solveLevel(h2Clearance, { maximumStates: 30000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(h2Clearance.board);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(h2Clearance, { maximumStates: 30000, maximumPlans: 1,
    forbiddenConditions: h2Clearance.theorem.proofConditions }).status).toBe('proven-unsolved');
});
