import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../assets/',import.meta.url),report={};
for(const name of ['environment','robot','crate','l-cargo','dummy']){
  const data=readFileSync(new URL(name+'.glb',root));assert.equal(data.toString('ascii',0,4),'glTF');
  const json=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)).trim());
  let triangles=0;
  for(const mesh of json.meshes)for(const p of mesh.primitives){
    assert(p.attributes.COLOR_0!==undefined,`${name} missing painted vertex colors`);
    const a=json.accessors[p.attributes.POSITION];assert(a.count>0);
    assert([...a.min,...a.max].every(Number.isFinite),`${name} invalid geometry bounds`);
    triangles+=(p.indices===undefined?a.count:json.accessors[p.indices].count)/3;
  }
  report[name]={bytes:data.length,triangles,meshes:json.meshes.length};
  if(name==='robot'){
    assert.equal(json.skins.length,1);assert.equal(json.skins[0].joints.length,52);
    const clips=json.animations.map(a=>a.name);assert.deepEqual(clips.slice().sort(),['Idle','Push','Walk']);
    assert(!json.nodes.some(n=>/Blade|Mannequin/i.test(n.name||'')));
    for(const clip of json.animations)assert(clip.channels.length>=52);
    report.robot.bones=52;report.robot.animations=clips;
  }
}
writeFileSync(new URL('geometry-validation.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
