import bpy,json
from mathutils import Vector
p='D:/LabProjects/LearnSokoban/experiments/wasteland-3d/assets/blade-actor.blend'
with bpy.data.libraries.load(p,link=False) as (src,dst):
    print('OBJECT_NAMES',src.objects)
    dst.objects=['Blade_KungFu']
rig=dst.objects[0];bpy.context.scene.collection.objects.link(rig)
print('RIG',rig.matrix_world[:],[(t.name,[(s.action.name,s.frame_start,s.frame_end) for s in t.strips]) for t in rig.animation_data.nla_tracks])
for b in rig.data.bones:
    if not any(t in b.name for t in ['thumb','index','middle','ring','pinky']): print('BONE',b.name,tuple(round(v,4) for v in b.head_local),tuple(round(v,4) for v in b.tail_local),b.parent.name if b.parent else None)
for track in rig.animation_data.nla_tracks:track.mute=True
for name in ['Idle','Walk','Push']:
    action=bpy.data.actions.get(name)
    rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
    for f in [1,15,30]:
        bpy.context.scene.frame_set(f)
        print('POSE',name,f,{p.name:tuple(round(v,3) for v in (rig.matrix_world@p.head)) for p in rig.pose.bones if p.name in ['pelvis','spine_01','spine_03','head','hand_l','hand_r','foot_l','foot_r','upperarm_l','upperarm_r']})
