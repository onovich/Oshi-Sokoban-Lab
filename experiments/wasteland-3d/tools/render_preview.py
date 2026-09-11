"""Render an offline reference image of the delivered assets, not an AI image."""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/wasteland.blend'))
with bpy.data.libraries.load(str(root/'assets/blade-actor.blend'),link=False) as (source,dest):
 dest.objects=list(source.objects)
for o in dest.objects:
 bpy.context.collection.objects.link(o)
 if o.type=='ARMATURE':
  o.location=(0,-4,0)
  for track in o.animation_data.nla_tracks:track.mute=track.name!='Idle'
for x,y in [(0,-1.8),(2.6,.8),(-2,2.5)]:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(root/'assets/crate.glb'))
 for o in set(bpy.data.objects)-before:
  if not o.parent:o.location.x+=x;o.location.y+=y
scene=bpy.context.scene
scene.frame_set(20)
scene.cycles.samples=16
scene.render.resolution_x=1400;scene.render.resolution_y=1050
scene.render.filepath=str(root/'preview.png')
bpy.ops.render.render(write_still=True)
