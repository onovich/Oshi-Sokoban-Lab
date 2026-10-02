// Run from repository root: node scripts/audit-oct-gate.mjs g02
// Copy together with oracle.mjs; all candidate sources resolve from the repository first.
import assert from 'node:assert/strict';
import {server,loadCandidate,search,replay,mutations,key,dirs} from './oct-gate-oracle.mjs';
const name=process.argv[2]??'g02',n=Number(name.replace(/\D/g,''));
try {
  const spec=(await loadCandidate(`oct-g${String(n).padStart(2,'0')}`))[`octG${String(n).padStart(2,'0')}`],b=spec.board;
  let mode='',ban=()=>false,contrast;
  const movedBlockControl=(events,state,test)=>events.some(e=>{
    if(e.type!=='gate-pushed')return false;
    const gate=state.gates.find(g=>g.id===e.entityId),exit=state.gates.find(g=>g.id===gate.nextGateId);
    return state.blocks.some(block=>key(block.position)!==key(b.blocks.find(v=>v.id===block.id).position)&&test(block).some(p=>block.position.x+p.x===exit.position.x+e.to.x-e.from.x&&block.position.y+p.y===exit.position.y+e.to.y-e.from.y));
  });
  if(n===2){mode='noCorner';contrast={...b,walls:b.walls.filter(p=>key(p)!=='1,3')};}
  else if(n===3){ban=(es,s)=>movedBlockControl(es,s,block=>block.isFake?block.shape:[]);contrast={...b,walls:b.walls.filter(p=>key(p)!=='4,2')};}
  else if(n===4){ban=(es,s)=>es.some(e=>{if(e.type!=='rain-slid')return false;const[dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][dirs.indexOf(e.direction)];return s.gates.some(g=>g.position.x===e.to.x+dx&&g.position.y===e.to.y+dy&&key(g.position)!==key(b.gates.find(v=>v.id===g.id).position));});contrast={...b,walls:[...b.walls,{x:1,y:2}]};}
  else if(n===5){ban=(es,s)=>movedBlockControl(es,s,block=>block.shape.slice(1));contrast={...b,walls:b.walls.filter(p=>key(p)!=='1,1')};}
  else if(n===6){ban=(es,s)=>es.some(e=>{if(e.type!=='gate-pushed')return false;const gate=s.gates.find(g=>g.id===e.entityId),exit=s.gates.find(g=>g.id===gate.nextGateId);return s.gates.some(g=>g.id!==gate.id&&g.id!==exit.id&&key(g.position)!==key(b.gates.find(v=>v.id===g.id).position)&&g.position.x===exit.position.x+e.to.x-e.from.x&&g.position.y===exit.position.y+e.to.y-e.from.y);});contrast={...b,walls:b.walls.filter(p=>key(p)!=='0,3')};}
  else if(n===7){mode='noReverse';contrast={...b,terrainGoals:[{x:2,y:2}]};}
  else throw Error(`No verified audit contract for ${name}`);
  const base=search(b),forbidden=search(b,mode,ban),decoupled=search(contrast,mode,ban);
  assert.equal(base.status,'solved');assert.equal(replay(b,base.path).state.status,'won');
  assert.equal(forbidden.status,'proven-unsolved');assert.equal(decoupled.status,'solved');
  assert.equal(replay(contrast,decoupled.path).state.status,'won');
  const {frozenLevelHash}=await server.ssrLoadModule('/src/course/accepted-freeze.ts');
  const removePairs=n===6?[['e','x'],['f','y']].map(pair=>({pair,...search({...b,gates:b.gates.filter(g=>!pair.some(suffix=>g.id.endsWith('-'+suffix)))})})):undefined;
  console.log(JSON.stringify({hash:frozenLevelHash(spec),base,forbidden,decoupled,noTraverse:search(b,'',es=>es.some(e=>e.type==='gate-traversed')),postCorner:n===2?search(b,'noPostCornerEntry'):undefined,mutations:mutations(b),removePairs,removeBlocks:b.blocks.map(block=>({id:block.id,...search({...b,blocks:b.blocks.filter(v=>v!==block)})}))},null,2));
} finally {await server.close();}
