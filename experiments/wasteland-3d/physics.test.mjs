import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, stepWorld, boxesOverlap, circleHitsBox, confineTarget } from './physics.js';
const empty=()=>makeWorld({bounds:{x:11.5,z:9.5},obstacles:[]});
test('walking into a crate pushes it while preserving player clearance',()=>{
 const w=empty();let pushed=false;
 for(let i=0;i<240;i++)pushed=stepWorld(w,0,-1.5/60).pushed||pushed;
 assert.equal(pushed,true);assert.ok(w.crates[0].z < -3);
 assert.equal(circleHitsBox(w.player,w.crates[0]),false);
});
test('a long step cannot tunnel through a wall or push a box through it',()=>{
 const w=empty();w.obstacles=[{x:0,z:-1,hx:2,hz:.3}];
 stepWorld(w,0,-30);
 assert.ok(w.player.z > 0);
 assert.equal(boxesOverlap(w.crates[0],w.obstacles[0]),false);
 assert.equal(circleHitsBox(w.player,w.crates[0]),false);
});
test('boxes stop against other boxes; the sandbox does not chain-push',()=>{
 const w=empty();w.crates[1].x=0;w.crates[1].z=-.5;
 stepWorld(w,0,-12);
 assert.equal(w.crates[1].z,-.5);
 assert.equal(boxesOverlap(w.crates[0],w.crates[1]),false);
});
test('player and crates stay within the yard even for diagonal long steps',()=>{
 const w=empty();stepWorld(w,100,100);
 assert.ok(w.player.x<=11.02+1e-8);assert.ok(w.player.z<=9.02+1e-8);
 w.player={x:0,z:4};stepWorld(w,0,-40);
 assert.ok(w.crates[0].z-.64>=-9.5-1e-8);
});
test('camera confinement accounts for off-centre perspective footprints',()=>{
 const r=confineTarget({x:9,z:9},10,8,[{x:-2,z:-6},{x:3,z:2}]);
 assert.deepEqual(r,{x:7,z:6,fits:true});
});
test('oversized viewport is centred and explicitly reports that it cannot fit',()=>{
 const r=confineTarget({x:9,z:9},4,4,[{x:-8,z:-5},{x:12,z:7}]);
 assert.deepEqual(r,{x:-2,z:-1,fits:false});
});
