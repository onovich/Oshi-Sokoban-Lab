"""Render actual geometry closeups headlessly; no generated-paintover dependency."""
import bpy,math,pathlib
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
camera=scene.camera
for name,loc,aim,scale in [('robot-back',(2.8,-5,2.3),(0,0,1),2.35),('robot-head',(2.8,5,2.3),(0,0,1.64),.79)]:
    camera.location=loc;camera.rotation_euler=(Vector(aim)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
    scene.render.resolution_x=1000;scene.render.resolution_y=1100
    scene.render.filepath=str(root/(name+'.png'));bpy.ops.render.render(write_still=True)
