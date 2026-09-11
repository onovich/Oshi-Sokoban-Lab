// Continuous sandbox motion and compound cargo collision, independent of puzzle rules.
export const RADIUS = .27;
export const PUSH_REACH = .53;
export const SPAWN = {x:-.8,z:3.2};
export function makeWorld(collision){return {...collision,player:{...(collision.spawn||SPAWN)},bodies:(collision.bodies||[]).map(b=>({...b,cells:b.cells.map(c=>({...c}))}))};}
export function hits(p,b,radius=RADIUS){
  const x=Math.max(Math.abs(p.x-b.x)-b.hx,0),z=Math.max(Math.abs(p.z-b.z)-b.hz,0);
  return x*x+z*z<radius*radius-1e-9;
}
export function bodyBoxes(body){return body.cells.map(c=>({...c,x:c.x+body.x,z:c.z+body.z}));}
function overlaps(a,b){return Math.abs(a.x-b.x)<a.hx+b.hx-1e-8&&Math.abs(a.z-b.z)<a.hz+b.hz-1e-8;}
function canPlace(world,body){
  return bodyBoxes(body).every(a=>Math.abs(a.x)+a.hx<=world.bounds.x&&Math.abs(a.z)+a.hz<=world.bounds.z
    &&!world.obstacles.some(b=>overlaps(a,b))&&!world.bodies.some(b=>b.id!==body.id&&bodyBoxes(b).some(c=>overlaps(a,c))));
}
export function stepWorld(world,dx,dz){
  const old={...world.player},steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));
  let pushed=false,contact=null,blocked=false,pushAxis=null;
  for(let i=0;i<steps;i++)for(const [axis,delta] of [['x',dx/steps],['z',dz/steps]]){
    if(!delta)continue;
    const next={...world.player,[axis]:world.player[axis]+delta};
    if(Math.abs(next.x)>world.bounds.x-RADIUS||Math.abs(next.z)>world.bounds.z-RADIUS)continue;
    if(world.obstacles.some(box=>hits(next,box)))continue;
    // Any body within hand reach can be pushed only on the face we are approaching.
    const approached=world.bodies.filter(body=>bodyBoxes(body).some(box=>{
      if(!hits(next,box,PUSH_REACH))return false;
      const other=axis==='x'?'z':'x';const half=axis==='x'?'hx':'hz';
      return (next[axis]-box[axis])*delta<0&&Math.abs(next[axis]-box[axis])>=box[half]-.02
        &&Math.abs(next[other]-box[other])<(other==='x'?box.hx:box.hz)+.10;
    }));
    if(approached.length){
      if(approached.length!==1){blocked=true;continue;}
      const body=approached[0];contact=body.id;pushAxis={x:axis==='x'?Math.sign(delta):0,z:axis==='z'?Math.sign(delta):0};
      const amount=delta*.58;
      const candidate={...body,[axis]:body[axis]+amount};
      if(!canPlace(world,candidate)){blocked=true;continue;}
      const playerNext={...world.player,[axis]:world.player[axis]+amount};
      if(world.obstacles.some(b=>hits(playerNext,b))||world.bodies.some(b=>b.id!==body.id&&bodyBoxes(b).some(box=>hits(playerNext,box))))continue;
      body[axis]=candidate[axis];Object.assign(world.player,playerNext);pushed=true;continue;
    }
    if(world.bodies.some(body=>bodyBoxes(body).some(box=>hits(next,box))))continue;
    Object.assign(world.player,next);
  }
  return {distance:Math.hypot(world.player.x-old.x,world.player.z-old.z),pushed,contact,blocked,pushAxis};
}
export function confineTarget(target,halfX,halfZ,offsets){
  const minX=Math.min(...offsets.map(p=>p.x)),maxX=Math.max(...offsets.map(p=>p.x));
  const minZ=Math.min(...offsets.map(p=>p.z)),maxZ=Math.max(...offsets.map(p=>p.z));
  const lowX=-halfX-minX,highX=halfX-maxX,lowZ=-halfZ-minZ,highZ=halfZ-maxZ;
  return {x:lowX>highX?-(minX+maxX)/2:Math.max(lowX,Math.min(highX,target.x)),z:lowZ>highZ?-(minZ+maxZ)/2:Math.max(lowZ,Math.min(highZ,target.z)),fits:lowX<=highX&&lowZ<=highZ};
}
