import{createGame,move,dirs,key}from'./oct-gate-oracle.mjs';
// History marks which gates the moved task block licensed. Death clears history.
export function searchResetAfterControl(board,budget=20000){
 const initial=createGame(board),q=[[initial,'',0]],signature=(s,flag)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.gates.map(g=>g.position),flag]),seen=new Set([signature(initial,0)]);
 for(let i=0;i<q.length;i++){
  if(q.length>budget)return{status:'budget-exhausted',states:q.length};
  const[s,path,flag]=q[i];if(s.status==='won')return{status:'solved',path,states:q.length};
  for(let d=0;d<4;d++){
   const r=move(s,dirs[d]);if(!r.didMove)continue;
   let nextFlag=flag;
   for(const e of r.events){if(e.type!=='gate-pushed')continue;const gi=s.gates.findIndex(g=>g.id===e.entityId),gate=s.gates[gi],ex=s.gates.find(g=>g.id===gate.nextGateId);if(s.blocks.some(b=>key(b.position)!==key(board.blocks.find(v=>v.id===b.id).position)&&b.position.x===ex.position.x+e.to.x-e.from.x&&b.position.y===ex.position.y+e.to.y-e.from.y))nextFlag|=1<<gi;}
   if(r.events.some(e=>e.type==='death-reset'))nextFlag=0;
   const preserved=r.state.gates.some((g,i)=>(nextFlag&(1<<i))&&key(g.position)!==key(board.gates[i].position));
   if(preserved&&r.events.some(e=>e.type==='object-reset'&&e.entityType==='block'))continue;
   const k=signature(r.state,nextFlag);if(seen.has(k))continue;seen.add(k);q.push([{...r.state,history:[]},path+'URDL'[d],nextFlag]);
  }
 }return{status:'proven-unsolved',states:q.length};
}
