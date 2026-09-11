"""Headless build of the revised concept-faithful scene and Humanoid robot."""
import bpy,sys,random,pathlib,json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from salvage_environment import build as environment
from salvage_robot import build as robot
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.preferences.filepaths.save_version=0
random.seed(701);out=ROOT/'assets';out.mkdir(exist_ok=True)
scene=bpy.context.scene;scene.render.fps=30
static,dynamic=environment(out)
print('REVISED ENVIRONMENT COMPLETE',flush=True)
rig,body=robot(out)
print('HUMANOID AND RETARGET COMPLETE',flush=True)
rig.location=(-.8,-2.06,0)
for t in rig.animation_data.nla_tracks:t.mute=t.name!='Push'
scene.frame_set(15)
bpy.ops.object.camera_add(location=(15,-19,16))
camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.35))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=21.7;scene.camera=camera
bpy.ops.object.light_add(type='SUN',location=(-6,-7,12))
sun=bpy.context.object;sun.rotation_euler=(.4,-.52,-.45);sun.data.energy=2.3;sun.data.angle=.05
scene.world=bpy.data.worlds.new('Desaturated dust');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.35,.38,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT/'blender-preview.png');scene.frame_end=60
bpy.ops.wm.save_as_mainfile(filepath=str(out/'faceted-salvage.blend'))
(out/'manifest.json').write_text(json.dumps(dict(revision=2,generator=bpy.app.version_string,seed=701,actor='Original mesh; Humanoid T pose',bones=len(rig.data.bones),animations=['Idle','Walk','Push'],staticObjects=len(static),movableObjects=3,puzzleEngineConnected=False),indent=2))
if '--render' in sys.argv:
    bpy.ops.render.render(write_still=True)
    for o in static+dynamic:o.hide_render=True
    rig.location=(0,0,0)
    for t in rig.animation_data.nla_tracks:t.mute=True
    rig.animation_data.action=None
    from mathutils import Matrix
    import math
    for p in rig.pose.bones:p.matrix_basis=Matrix.Identity(4)
    bpy.context.view_layer.update()
    for side,s in [('Left',-1),('Right',1)]:
        p=rig.pose.bones[side+'UpperArm'];pivot=p.head.copy()
        p.matrix=Matrix.Translation(pivot)@Matrix.Rotation(s*math.pi/2,4,'Y')@Matrix.Translation(-pivot)@p.matrix
        bpy.context.view_layer.update()
    camera.location=(2.8,5,2.3);camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=2.35
    scene.render.resolution_x=900;scene.render.resolution_y=1100;scene.render.filepath=str(ROOT/'robot-detail.png');bpy.ops.render.render(write_still=True)
print('REVISION 2 COMPLETE',flush=True)
