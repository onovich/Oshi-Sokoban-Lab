import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { rainStopPrelude } from './rs04-rain-stop';

function search(weather: 'rain' | 'clear', forbidStop: boolean) {
  const queue = [createGame({ ...rainStopPrelude.board, weather })];
  const key = (s: typeof queue[number]) => JSON.stringify([s.player,s.blocks.map(b=>b.position)]);
  const seen = new Set([key(queue[0]!)]);
  for(let i=0;i<queue.length;i++) {
    const state=queue[i]!;
    if(state.status==='won') return true;
    for(const d of ['up','right','down','left'] as const) {
      const next=move(state,d).state;
      if(forbidStop && state.player.x===4 && state.player.y===2 && next.player.x===3 && next.player.y===2) continue;
      const k=key(next); if(seen.has(k))continue;
      seen.add(k);queue.push({...next,history:[]});
    }
  }
  return false;
}

it('requires the intermediate stopping approach in rain, not merely the final push',()=>{
  expect(search('rain',false)).toBe(true);
  expect(search('rain',true)).toBe(false);
  expect(search('clear',true)).toBe(true);
});

it('lets the player win by preserving the completed block and circling around',()=>{
  let state=createGame(rainStopPrelude.board);
  for(const d of ['down','right','up','left','down'] as const) state=move(state,d).state;
  expect(state.status).toBe('won');
  expect(state.blocks[0]!.position).toEqual({x:1,y:2});
});
