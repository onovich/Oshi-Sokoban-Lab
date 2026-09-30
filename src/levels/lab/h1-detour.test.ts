import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { h1Detour } from './h1-detour';

const directions = ['up', 'right', 'down', 'left'] as const;
type State = ReturnType<typeof createGame>;
type Result = ReturnType<typeof move>;
function replay(route: string, state = createGame(h1Detour.board)) {
  for (const letter of route) {
    const result = move(state, directions['URDL'.indexOf(letter)]!);
    expect(result.didMove).toBe(true);
    state = result.state;
  }
  return state;
}

it('completes the detour and delayed upper-box finish without a reset', () => {
  let state = createGame(h1Detour.board), pushes = 0;
  for (const letter of 'RDRULURRURDLLLUR') {
    const result = move(state, directions['URDL'.indexOf(letter)]!);
    expect(result.didMove).toBe(true);
    expect(result.events.some(e => e.type === 'object-reset' || e.type === 'death-reset')).toBe(false);
    pushes += result.events.filter(e => e.type === 'block-pushed').length;
    state = result.state;
  }
  expect(state.status).toBe('won');
  expect(pushes).toBe(6);
});

type Node = { state: State; inputs: number; pushes: number };
// This static clear-weather board only has player and fixed-shape Block positions as mutable rule state.
// All edges use move(). Dijkstra compares either (inputs,pushes) or (pushes,inputs).
function search(board = h1Detour.board, ban?: (before: State, result: Result) => boolean, pushesFirst = false) {
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
const withoutSpike = { ...h1Detour.board, terrainSpikes: [] };

it('reset does not improve either the shortest-input or the minimum-push solution', () => {
  for (const pushesFirst of [false, true]) {
    expect(search(h1Detour.board, undefined, pushesFirst)).toEqual({ inputs: 16, pushes: 6 });
    expect(search(h1Detour.board, reset, pushesFirst)).toEqual({ inputs: 16, pushes: 6 });
    expect(search(withoutSpike, undefined, pushesFirst)).toEqual({ inputs: 8, pushes: 4 });
  }
});

it('the detour needs B off its Goal when A completes; removing Spike decouples their final order', () => {
  const requireBFinished = (_s: State, r: Result) => {
    const a = r.state.blocks[0]!.position, b = r.state.blocks[1]!.position;
    return a.x === 4 && a.y === 2 && !(b.x === 3 && b.y === 0);
  };
  expect(search(h1Detour.board, requireBFinished)).toBeNull();
  expect(search(withoutSpike, requireBFinished)).not.toBeNull();
  expect(replay('RUURDLDRR', createGame(withoutSpike)).status).toBe('won');
});

it('the straight near-route really loses the already useful forward staging', () => {
  const staged = replay('R');
  expect(staged.blocks[0]!.position).toEqual({ x: 2, y: 2 });
  const result = move(staged, 'right');
  expect(result.didMove).toBe(true);
  expect(result.events).toContainEqual(expect.objectContaining({ type: 'object-reset',
    entityId: `${h1Detour.id}-a`, from: { x: 3, y: 2 }, to: { x: 1, y: 2 } }));
  expect(result.state.blocks[0]!.position).toEqual({ x: 1, y: 2 });
  expect(result.state.player).toEqual({ x: 2, y: 2 });
  expect(result.state.blocks[1]).toEqual(staged.blocks[1]);
});

it('retains the entry choice for trying the tempting near Goal, not as shortest-route decoration', () => {
  const early = replay('URUR');
  expect(early.blocks[1]!.position).toEqual({ x: 3, y: 0 });
  const sealed = { ...h1Detour.board, walls: [...h1Detour.board.walls, { x: 0, y: 1 }] };
  expect(move(createGame(sealed), 'up').didMove).toBe(false);
  expect(search(sealed)).toEqual({ inputs: 16, pushes: 6 });
});

it('ordinary transport floor cells are necessary, while the marked choice cell is deliberately optional', () => {
  for (const [x,y] of [[1,0],[4,0],[1,1],[2,1],[3,1],[4,1],[2,2],[1,3],[2,3]]) {
    expect(search({ ...h1Detour.board, walls: [...h1Detour.board.walls, { x:x!, y:y! }] })).toBeNull();
  }
});

it('the non-final upper transport landmark is unavoidable, independently of the state-relation proof', () => {
  const report = solveLevel(h1Detour, { maximumStates: 30000, maximumPlans: 1 });
  expect(report.status).toBe('solved');
  let state = createGame(h1Detour.board);
  for (const direction of report.bestPlan!.directions) state = move(state, direction).state;
  expect(state.status).toBe('won');
  expect(solveLevel(h1Detour, { maximumStates: 30000, maximumPlans: 1,
    forbiddenConditions: h1Detour.theorem.proofConditions }).status).toBe('proven-unsolved');
});
