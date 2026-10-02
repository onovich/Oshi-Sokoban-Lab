import{expect,it}from'vitest';import{createGame,move}from'../../engine/game-engine';import{solveLevel}from'../../solver/level-solver';import{octM07}from'./oct-m07';
const dirs=['up','right','down','left']as const;type State=ReturnType<typeof createGame>;
function replay(path:string,state=createGame(octM07.board)){for(const l of path){const r=move(state,dirs['URDL'.indexOf(l)]!);expect(r.didMove).toBe(true);state=r.state;}return state;}
it('crosses the remotely blocked multi-cell Goal and assembles mixed complete coverage',()=>{expect(replay('RRRLRUULDRDL').status).toBe('won');});
function search(initial:State){const key=(s:State)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.goals.map(g=>g.position)]),q=[initial],seen=new Set([key(initial)]);for(let i=0;i<q.length;i++){if(q.length>40000)throw new Error('Unknown: budget exhausted');const s=q[i]!;if(s.status==='won')return true;for(const d of dirs){const r=move(s,d);if(!r.didMove)continue;const k=key(r.state);if(seen.has(k))continue;seen.add(k);q.push({...r.state,history:[]});}}return false;}
it('cannot bypass either the crossing or the nonfinal Goal relocation',()=>{for(const condition of octM07.theorem.proofConditions)expect(solveLevel(octM07,{maximumStates:40000,maximumPlans:1,forbiddenConditions:[condition]}).status).toBe('proven-unsolved');});
it('only the distant composition cell changes crossing to pushing in the local contrast',()=>{
 const original=move(replay('R'),'right');expect(original.events.some(e=>e.type==='goal-crossed')).toBe(true);
 const flat={...octM07.board,goals:[{...octM07.board.goals[0]!,shape:[{x:0,y:0}]}]};
 const contrast=move(replay('R',createGame(flat)),'right');expect(contrast.events.some(e=>e.type==='goal-pushed')).toBe(true);
 expect(replay('RDRURLRUULDRDL',createGame(flat)).status).toBe('won');
});
it('the visible right-alignment shortcut for Block is a real dead end',()=>{const s=replay('UR');expect(s.blocks[0]!.position).toEqual({x:2,y:1});expect(search(s)).toBe(false);});
it('keeps a deliberate error-plan approach but requires all other free cells',()=>{
 for(const[x,y]of[[1,2],[1,3],[2,0],[3,0],[3,1],[3,2]])expect(search(createGame({...octM07.board,walls:[...octM07.board.walls,{x:x!,y:y!}]}))).toBe(false);
 expect(replay('RRRLRUULDRDL',createGame({...octM07.board,walls:[...octM07.board.walls,{x:0,y:1}]})).status).toBe('won');
});
