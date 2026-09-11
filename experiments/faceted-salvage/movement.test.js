import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeWorld,stepWorld,hits,confineTarget,RADIUS} from './movement.js';
const collision=JSON.parse(readFileSync(new URL('./assets/collision.json',import.meta.url)));
test('spawn is unobstructed; demo pushes the numbered crate',()=>{
  const world=makeWorld(collision);
  assert(!world.obstacles.some(b=>hits(world.player,b)));
  for(let i=0;i<240;i++)stepWorld(world,0,-1.65/60);
  assert(world.player.z < 0);
  assert(world.bodies.find(b=>b.id==='crate').z < -2);
});
test('pushed crate stops against walls without tunneling',()=>{
  const world=makeWorld({bounds:{x:10,z:10},obstacles:[{x:0,z:-2,hx:2,hz:.2}],bodies:[{id:'a',x:0,z:0,cells:[{x:0,z:0,hx:.5,hz:.5}]}]});
  world.player={x:0,z:2};const result=stepWorld(world,0,-20);
  assert(result.pushed);assert(result.blocked);
  assert(world.bodies[0].z>=-1.3);assert(world.bodies[0].z < -1.25);
  assert(world.player.z > world.bodies[0].z+.5+RADIUS);
});
test('cargo cannot push another cargo; reset does not inherit moved state',()=>{
  const config={bounds:{x:10,z:10},obstacles:[],bodies:[{id:'a',x:0,z:0,cells:[{x:0,z:0,hx:.5,hz:.5}]},{id:'b',x:0,z:-2,cells:[{x:0,z:0,hx:.5,hz:.5}]}]};
  const world=makeWorld(config);world.player={x:0,z:2};stepWorld(world,0,-10);
  assert.equal(world.bodies[1].z,-2);assert(world.bodies[0].z>=-1);
  assert.equal(makeWorld(config).bodies[0].z,0);
});
test('L cargo moves as one body; every protruding cell blocks against obstacles',()=>{
  const world=makeWorld({bounds:{x:10,z:10},obstacles:[{x:2,z:-2,hx:.5,hz:.5}],bodies:[{id:'l',x:0,z:0,cells:[{x:0,z:0,hx:.5,hz:.5},{x:2,z:0,hx:.5,hz:.5},{x:2,z:1,hx:.5,hz:.5}]}]});
  world.player={x:0,z:2};stepWorld(world,0,-10);
  assert(world.bodies[0].z>=-1);assert(world.bodies[0].z<-.95);
  assert.equal(world.bodies[0].cells[2].z,1);
});
test('fixed cargo blocks walking, does not move, and cannot be tunneled through',()=>{
  const world=makeWorld({bounds:{x:10,z:10},obstacles:[{x:0,z:0,hx:.7,hz:.7}]});
  world.player={x:0,z:2};
  stepWorld(world,0,-6);
  assert(world.player.z >= .7+RADIUS-1e-6);
  assert.deepEqual(world.obstacles,[{x:0,z:0,hx:.7,hz:.7}]);
});
test('diagonal input slides along wall and stays within play area',()=>{
  const world=makeWorld({bounds:{x:3,z:3},obstacles:[{x:0,z:0,hx:.2,hz:2}]});
  world.player={x:-.5,z:0};stepWorld(world,1,1);
  assert(world.player.x<=-.2-RADIUS+1e-6);assert(world.player.z>.9);
  stepWorld(world,-100,100);
  assert(Math.abs(world.player.x)<=3-RADIUS);assert(Math.abs(world.player.z)<=3-RADIUS);
});
test('camera confiner clamps a fitting view and reports an oversized view',()=>{
  assert.deepEqual(confineTarget({x:8,z:-8},6,6,[{x:-2,z:-2},{x:2,z:2}]),{x:4,z:-4,fits:true});
  const large=confineTarget({x:8,z:-8},6,6,[{x:-10,z:-10},{x:10,z:10}]);
  assert.equal(large.fits,false);assert.equal(Math.abs(large.x),0);
});
