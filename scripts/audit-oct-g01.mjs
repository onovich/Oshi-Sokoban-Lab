import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const {createGame,move}=await server.ssrLoadModule('/src/engine/game-engine.ts');
const {octG01:spec}=await server.ssrLoadModule('/src/levels/lab/oct-g01.ts');
const dirs=['up','right','down','left'];
const key=p=>`${p.x},${p.y}`;
function search(board,ban=()=>false,budget=60000){const init=createGame(board),q=[[init,'']],seen=new Set();const sig=s=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.gates.map(g=>g.position)]);seen.add(sig(init));for(let i=0;i<q.length;i++){if(q.length>budget)return{status:'budget-exhausted',states:q.length};const[s,p]=q[i];if(s.status==='won')return{status:'solved',path:p,states:q.length};for(let d=0;d<4;d++){const r=move(s,dirs[d]);if(!r.didMove||ban(r.events,s,r.state))continue;const k=sig(r.state);if(seen.has(k))continue;seen.add(k);q.push([{...r.state,history:[]},p+'URDL'[d]]);}}return{status:'proven-unsolved',states:q.length};}
function replay(b,path){let s=createGame(b);for(const l of path){const r=move(s,dirs['URDL'.indexOf(l)]);if(!r.didMove)throw Error('blocked replay');s=r.state;console.log(l,JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.gates.map(g=>g.position)]),JSON.stringify(r.events));}if(s.status!=='won')throw Error('not won');}
try{
 const b=spec.board;const{frozenLevelHash}=await server.ssrLoadModule('/src/course/accepted-freeze.ts');console.log('HASH',frozenLevelHash(spec));
 const base=search(b);console.log('BASE',{...base,inputs:base.path?.length});const gatePush=id=>es=>es.some(e=>e.type==='gate-pushed'&&e.entityId===id);
 for(const g of b.gates)console.log('BAN',g.id,search(b,gatePush(g.id)));
 for(const g of b.gates)console.log('BAN-ACTIVE',g.id,search(b,(es,s)=>es.some(e=>{if(e.type!=='gate-pushed'||e.entityId!==g.id)return false;const other=s.gates.find(v=>v.id===g.nextGateId);const dx=e.to.x-e.from.x,dy=e.to.y-e.from.y;return s.blocks.some(v=>v.position.x===other.position.x+dx&&v.position.y===other.position.y+dy&&(key(v.position)!==key(b.blocks.find(a=>a.id===v.id).position)));})));
 const con={...b,terrainGoals:[{x:3,y:2},{x:5,y:2}]};console.log('CON',search(con,gatePush(b.gates[1].id)));
 const excluded=new Set([key(b.player),...b.walls.map(key),...b.terrainGoals.map(key),...b.blocks.map(e=>key(e.position)),...b.gates.map(e=>key(e.position))]);
 for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){if(excluded.has(key({x,y})))continue;const m={...b,walls:[...b.walls,{x,y}]};const found=search(m);console.log('CLOSE',x,y,found);if(found.status==='solved')for(const g of b.gates)console.log('CLOSE-NOACTIVE',x,y,g.id,search(m,(es,s)=>es.some(e=>{if(e.type!=='gate-pushed'||e.entityId!==g.id)return false;const other=s.gates.find(v=>v.id===g.nextGateId);return s.blocks.some(v=>v.position.x===other.position.x+e.to.x-e.from.x&&v.position.y===other.position.y+e.to.y-e.from.y&&key(v.position)!==key(m.blocks.find(a=>a.id===v.id).position));})));}
 for(const block of b.blocks)console.log('REMOVE',block.id,search({...b,blocks:b.blocks.filter(e=>e.id!==block.id)}));
 replay(b,base.path);
}finally{await server.close();}
