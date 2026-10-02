import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=process.cwd(),require=createRequire(resolve(root,'package.json'));
const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);
export const server=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'custom'});
export async function loadCandidate(name){const repo=resolve(root,'src/levels/lab',name+'.ts');const fallback=fileURLToPath(new URL(name+'.ts',import.meta.url));return server.ssrLoadModule((existsSync(repo)?repo:fallback).replaceAll('\\','/'));}
export const {createGame,move}=await server.ssrLoadModule('/src/engine/game-engine.ts');
export const dirs=['up','right','down','left'];
export const key=p=>`${p.x},${p.y}`;
export function search(board,mode='',ban=()=>false,budget=20000){const init=createGame(board),q=[[init,'',0]],seen=new Set();const sig=(s,m)=>JSON.stringify([s.player,...s.blocks.map(b=>b.position),...s.gates.map(g=>g.position),mode?m:0]);seen.add(sig(init,0));for(let i=0;i<q.length;i++){if(q.length>budget)return{status:'budget-exhausted',states:q.length};const[s,p,mask]=q[i];if(s.status==='won')return{status:'solved',path:p,states:q.length};for(let d=0;d<4;d++){const r=move(s,dirs[d]);if(!r.didMove||ban(r.events,s,r.state))continue;if(mode==='noPostCornerEntry'&&r.events.some(e=>{if(e.type!=='gate-traversed')return false;const gi=s.gates.findIndex(g=>g.id===e.entryGateId),bits=(mask>>(4*gi))&15;return (bits&5)&&(bits&10);}))continue;let m=mask,deny=false;for(const e of r.events){if(e.type!=='gate-pushed')continue;const gi=s.gates.findIndex(g=>g.id===e.entityId);if(mode==='noCorner'&&(mask&((d%2===0?10:5)<<(gi*4))))deny=true;if(mode==='noReverse'&&(mask&(1<<(gi*4+(d+2)%4))))deny=true;m|=1<<(gi*4+d);}if(deny)continue;const k=sig(r.state,m);if(seen.has(k))continue;seen.add(k);q.push([{...r.state,history:[]},p+'URDL'[d],m]);}}return{status:'proven-unsolved',states:q.length};}
export function replay(board,path){let s=createGame(board),events=[];for(const l of path){const r=move(s,dirs['URDL'.indexOf(l)]);if(!r.didMove)throw Error('blocked replay');events.push(...r.events);s=r.state;}return{state:s,events};}
export function mutations(board){const occupied=new Set([key(board.player),...board.walls.map(key),...board.terrainGoals.map(key),...board.terrainSpikes.map(key),...board.blocks.flatMap(b=>b.shape.map(p=>key({x:b.position.x+p.x,y:b.position.y+p.y}))),...board.gates.map(g=>key(g.position))]);const out=[];for(let y=0;y<board.height;y++)for(let x=0;x<board.width;x++){if(occupied.has(key({x,y})))continue;out.push({cell:{x,y},...search({...board,walls:[...board.walls,{x,y}]})});}return out;}
