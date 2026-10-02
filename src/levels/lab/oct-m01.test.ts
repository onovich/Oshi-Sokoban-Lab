import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { octM01 } from './oct-m01';
const directions = ['up','right','down','left'] as const;
type State = ReturnType<typeof createGame>;
function replay(route: string, state = createGame(octM01.board)) {
  for (const letter of route) { const result = move(state, directions['URDL'.indexOf(letter)]!);
    expect(result.didMove).toBe(true); state = result.state; }
  return state;
}
it('crosses the parked multi-cell Goal and restores its coverage before transporting the Block', () => {
  expect(replay('LLLRLUURD').status).toBe('won');
});

function search(initial: State, ban?: (result: ReturnType<typeof move>) => boolean) {
  const queue = [initial], key = (s: State) => JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)]);
  const seen = new Set([key(initial)]);
  for(let i=0;i<queue.length;i++) {
    if(queue.length>40000) throw new Error('Budget exhausted: unknown');
    const state=queue[i]!; if(state.status==='won') return true;
    for(const direction of directions) { const result=move(state,direction);
      if(!result.didMove||ban?.(result)) continue;
      const signature=key(result.state);if(seen.has(signature))continue;
      seen.add(signature);queue.push({...result.state,history:[]});
    }
  }
  return false;
}
it('uses an internal contact of the same Goal to recover its offset', () => {
  const inside = replay('LLL');
  expect(inside.player).toEqual({x:0,y:2});
  expect(inside.goals[0]!.position).toEqual({x:0,y:2});
  const recovered = move(inside,'right');
  expect(recovered.events).toContainEqual(expect.objectContaining({ type:'goal-pushed',
    entityId:`${octM01.id}-g`,from:{x:0,y:2},to:{x:1,y:2} }));
  expect(recovered.state.player).toEqual({x:1,y:2});
});
it('requires crossing and the non-final return event, not only the final Block push', () => {
  for(const condition of octM01.theorem.proofConditions) {
    expect(solveLevel(octM01,{maximumStates:40000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
  }
  expect(solveLevel(octM01,{maximumStates:40000,maximumPlans:1}).status).toBe('solved');
});
it('the right-hand bypass removes both Goal actions from the solution', () => {
  const contrast={...octM01.board,walls:[]};
  expect(search(createGame(contrast),r=>r.events.some(e=>e.type==='goal-pushed'||e.type==='goal-crossed'))).toBe(true);
  expect(replay('UULD',createGame(contrast)).status).toBe('won');
});
it('an early upward Block push is a real dead end, explaining the retained top square', () => {
  const error = replay('LLLRU');
  expect(error.blocks[0]!.position).toEqual({x:1,y:0});
  expect(search(error)).toBe(false);
  const sealed={...octM01.board,walls:[...octM01.board.walls,{x:2,y:0}]};
  expect(move(replay('LLLR',createGame(sealed)),'up').didMove).toBe(false);
  expect(replay('LLLRLUURD',createGame(sealed)).status).toBe('won');
});
it('the remaining unoccupied floor is necessary under individual sealing', () => {
  for(const [x,y] of [[0,0],[1,0],[0,1],[0,2]]) {
    expect(search(createGame({...octM01.board,walls:[...octM01.board.walls,{x:x!,y:y!}]}))).toBe(false);
  }
  expect(search(createGame({...octM01.board,goals:[]}))).toBe(false);
});
