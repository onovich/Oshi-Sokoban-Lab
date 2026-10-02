import { expect, it } from 'vitest';
import { createGame, move } from '../../engine/game-engine';
import { solveLevel } from '../../solver/level-solver';
import { octM02 } from './oct-m02';
const dirs=['up','right','down','left'] as const;
type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM02.board)) {
  for(const letter of path){const r=move(state,dirs['URDL'.indexOf(letter)]!);expect(r.didMove).toBe(true);state=r.state;}return state;
}
it('borrows the task Block as a Goal stop, then recovers the Goal for transport',()=>{
  expect(replay('RDRURLDLURRUL').status).toBe('won');
});
function searchable(state:State){const q=[state],key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)]),seen=new Set([key(state)]);
  for(let i=0;i<q.length;i++){if(q.length>40000)throw new Error('Budget exhausted: unknown');const s=q[i]!;if(s.status==='won')return true;
    for(const d of dirs){const r=move(s,d);if(!r.didMove)continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}
  return false;
}
it('task Block presence changes the same Goal input from pushing to crossing',()=>{
  const before=replay('RDR');
  expect(before.player).toEqual({x:2,y:2});
  expect(move(before,'up').events).toContainEqual(expect.objectContaining({type:'goal-crossed',entityId:`${octM02.id}-g`}));
  const withoutBlock=move({...before,blocks:[]},'up');
  expect(withoutBlock.events).toContainEqual(expect.objectContaining({type:'goal-pushed',from:{x:2,y:1},to:{x:2,y:0}}));
});
it('both non-final permission and return actions are unavoidable',()=>{
  expect(solveLevel(octM02,{maximumStates:40000,maximumPlans:1}).status).toBe('solved');
  for(const condition of octM02.theorem.proofConditions)expect(solveLevel(octM02,{maximumStates:40000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');
});
it('one additional lower bypass removes the crossing requirement',()=>{
  const contrast={...octM02,board:{...octM02.board,walls:octM02.board.walls.filter(p=>!(p.x===3&&p.y===2))}};
  expect(solveLevel(contrast,{maximumStates:40000,maximumPlans:1,forbiddenConditions:[octM02.theorem.proofConditions[0]!]}).status).toBe('solved');
  expect(replay('RRDRULLUR',createGame(contrast.board)).status).toBe('won');
});
it('pushing Goal to the right boundary is a real unrecoverable wrong plan',()=>{
  const early=replay('RR');
  expect(early.goals[0]!.position).toEqual({x:3,y:1});
  expect(searchable(early)).toBe(false);
});
it('each ordinary empty floor cell and the sole target are necessary',()=>{
  for(const [x,y] of [[1,0],[3,0],[2,1],[3,1],[1,2],[2,2]])expect(searchable(createGame({...octM02.board,walls:[...octM02.board.walls,{x:x!,y:y!}]}))).toBe(false);
  expect(searchable(createGame({...octM02.board,goals:[]}))).toBe(false);
});
