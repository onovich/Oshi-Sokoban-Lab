"""Download only the original Blade actor and compatible motion sources (requires gh auth)."""
import hashlib, json, pathlib, subprocess, os
ROOT = pathlib.Path(os.environ.get('BLADE_SOURCE_ROOT', str(pathlib.Path(__file__).resolve().parents[1] / 'source-blade')))
ROOT.mkdir(parents=True,exist_ok=True)
if not (ROOT / 'source-tree.json').exists():
 (ROOT / 'source-tree.json').write_bytes(subprocess.check_output(['gh','api','repos/onovich/Blade/git/trees/main?recursive=1']))
tree = json.loads((ROOT / 'source-tree.json').read_text(encoding='utf-8'))
paths = [
 'Assets/Res_Runtime/KungFu/Mod_Role_KungFu1.fbx',
 'Assets/Res_Runtime/KungFu/Tex_Role_KungFu1_Diffuse.png',
 'Assets/Res_Runtime/KungFu/RoleEntity_KungFu1.prefab',
 'Assets/Res_Runtime/KungFu/Animator_Role_KungFu1.controller',
 'Assets/Res_Runtime/KungFu/Anim_Role_KungFu1_Idle1.anim',
 'Assets/Res_Runtime/KungFu/Anim_Role_KungFu1_Move.anim',
 'Assets/Combat animations - Kung fu V1/Animations/IDLE.fbx',
 'Assets/Combat animations - Kung fu V1/Animations/IN PLACE/MOVE FORWARD IN PLACE.fbx',
]
commit_info=json.loads(subprocess.check_output(['gh','api','repos/onovich/Blade/commits/main']))
source_commit=commit_info['sha'] if tree['sha'] in (commit_info['sha'],commit_info['commit']['tree']['sha']) else None
manifest = {'repository':'https://github.com/onovich/Blade','commit':source_commit,'tree':commit_info['commit']['tree']['sha'] if source_commit else tree['sha'],'scope':'targeted asset snapshot, not a complete Unity checkout','files':[]}
for path in paths:
 for p in (path, path + '.meta'):
  entry = next((e for e in tree['tree'] if e['path'] == p), None)
  if not entry: continue
  target = ROOT / p
  target.parent.mkdir(parents=True, exist_ok=True)
  if not target.exists():
   blob = json.loads(subprocess.check_output(['gh','api',f"repos/onovich/Blade/git/blobs/{entry['sha']}"]))
   import base64
   target.write_bytes(base64.b64decode(blob['content']))
  manifest['files'].append({'path':p,'git_blob':entry['sha'],'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
  data=target.read_bytes()
  assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==entry['sha'], f'Local file differs from source: {p}'
  print(p, target.stat().st_size, flush=True)
(ROOT / 'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
