// Continuous walking only. All props are fixed; no imports from the puzzle engine.
export const RADIUS = .22;
export const SPAWN = {x:-2.4,z:3.5};
export function makeWorld(collision){return {player:{...SPAWN},...collision};}
export function hits(p,b){
  const x=Math.max(Math.abs(p.x-b.x)-b.hx,0),z=Math.max(Math.abs(p.z-b.z)-b.hz,0);
  return x*x+z*z<RADIUS*RADIUS-1e-9;
}
export function stepWorld(world,dx,dz){
  const old={...world.player},steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.04));
  for(let i=0;i<steps;i++)for(const [axis,delta] of [['x',dx/steps],['z',dz/steps]]){
    const next={...world.player,[axis]:world.player[axis]+delta};
    if(Math.abs(next.x)>world.bounds.x-RADIUS||Math.abs(next.z)>world.bounds.z-RADIUS)continue;
    if(world.obstacles.some(box=>hits(next,box)))continue;
    Object.assign(world.player,next);
  }
  return {distance:Math.hypot(world.player.x-old.x,world.player.z-old.z)};
}
export function confineTarget(target,halfX,halfZ,offsets){
  const minX=Math.min(...offsets.map(p=>p.x)),maxX=Math.max(...offsets.map(p=>p.x));
  const minZ=Math.min(...offsets.map(p=>p.z)),maxZ=Math.max(...offsets.map(p=>p.z));
  const lowX=-halfX-minX,highX=halfX-maxX,lowZ=-halfZ-minZ,highZ=halfZ-maxZ;
  return {x:lowX>highX?-(minX+maxX)/2:Math.max(lowX,Math.min(highX,target.x)),z:lowZ>highZ?-(minZ+maxZ)/2:Math.max(lowZ,Math.min(highZ,target.z)),fits:lowX<=highX&&lowZ<=highZ};
}
