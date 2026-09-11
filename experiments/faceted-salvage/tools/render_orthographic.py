"""Comparable front/side/back renders from one neutral pose and identical projection."""
import bpy,math,pathlib,sys
from mathutils import Vector,Matrix
root=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets'/'faceted-salvage.blend'))
scene=bpy.context.scene;rig=bpy.data.objects['SalvageHumanoid'];body=bpy.data.objects['Salvage07_OriginalArmor']
for o in scene.objects:
    if o.type=='MESH' and o!=body:o.hide_render=True
rig.location=(0,0,0)
for t in rig.animation_data.nla_tracks:t.mute=True
rig.animation_data.action=None
for p in rig.pose.bones:p.matrix_basis=Matrix.Identity(4)
bpy.context.view_layer.update()
for side,s in [('Left',-1),('Right',1)]:
    p=rig.pose.bones[side+'UpperArm'];pivot=p.head.copy()
    p.matrix=Matrix.Translation(pivot)@Matrix.Rotation(s*math.pi/2,4,'Y')@Matrix.Translation(-pivot)@p.matrix
    bpy.context.view_layer.update()
out=root/'art-review';out.mkdir(exist_ok=True)
tag=sys.argv[-1] if '--' in sys.argv else 'v3'
for name,loc in [('front',(0,5,.96)),('side',(5,0,.96)),('back',(0,-5,.96))]:
    scene.camera.location=loc;scene.camera.rotation_euler=(Vector((0,0,.96))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=2.1
    scene.render.resolution_x=700;scene.render.resolution_y=1200;scene.cycles.samples=24
    scene.render.filepath=str(out/f'model-{tag}-{name}.png');bpy.ops.render.render(write_still=True)
