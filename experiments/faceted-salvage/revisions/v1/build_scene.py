"""Blender 5.x headless: original faceted salvage set + rigid-weight humanoid rig.
blender -b --python tools/build_scene.py -- [--render]
"""
import bpy, math, random, json, pathlib, sys
from mathutils import Vector

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(107)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.render.fps = 30

def material(name, color, metal=0, rough=1, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if emission:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = emission
    return m

sand = material('01 Sandstone', (.38,.29,.19))
bone = material('02 Bone ceramic', (.63,.59,.47))
light = material('03 Pale cut edges', (.79,.73,.57))
dark = material('04 Charcoal iron', (.055,.064,.063), .15)
rust = material('05 Rust red', (.42,.16,.072))
ochre = material('06 Safety ochre', (.85,.49,.055))
white = material('07 Ivory stencil', (.91,.87,.72))
red = material('08 Hazard red', (.57,.06,.022))
blue = material('09 Blue energy', (.035,.38,.9), 0,.4, .8)
orange = material('10 Orange energy', (1,.28,.02),0,.4,.65)
water = material('11 Shallow water facets', (.16,.23,.24),.22,.32)
stone = [material('Slab tone %02d'%i,(.31+i*.018,.295+i*.017,.26+i*.014)) for i in range(6)]

def deselect(): bpy.ops.object.select_all(action='DESELECT')

def box(name, loc, size, mat, bevel=0):
    deselect()
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Single cut bevel','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def mesh(name, verts, faces, mat):
    m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update()
    o=bpy.data.objects.new(name,m);scene.collection.objects.link(o);m.materials.append(mat)
    return o

def rod(name,a,b,r,mat,vertices=8,r2=None):
    a,b=Vector(a),Vector(b);deselect()
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(mat)
    return o

def rock(name,loc,scale,mat):
    deselect();bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.rotation_euler=(random.random(),random.random(),random.random()*6);o.data.materials.append(mat)
    return o

def text(body,loc,size,mat,rot=(0,0,0)):
    deselect();c=bpy.data.curves.new('Stencil','FONT');c.body=body;c.size=size;c.extrude=.001;c.align_x='CENTER'
    o=bpy.data.objects.new('Stencil '+body,c);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;c.materials.append(mat)
    o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    return o

obstacles=[]
def obstacle(x,y,hx,hy):obstacles.append(dict(x=x,z=-y,hx=hx,hz=hy))

box('Stratified foundation',(0,0,-.48),(13.7,13.7,.85),dark,.20)
box('Sandstone foundation',(0,0,-.24),(13.5,13.5,.40),sand,.10)
for x in range(8):
    for y in range(8):
        cx,cy=(x-3.5)*1.6,(y-3.5)*1.6
        box('Grid slab %d %d'%(x,y),(cx,cy,-.035),(1.577,1.577,.12),random.choice(stone),.025)
        if random.random()<.20:
            points=[(cx-.6,cy-.45,.03),(cx-.27,cy-.16,.03),(cx-.08,cy+.31,.03)]
            for a,b in zip(points,points[1:]):rod('Slab fracture',a,b,.008,dark,4)
        if random.random()<.2:
            mesh('Planar dust',[(cx-.7,cy-.6,.031),(cx+.3,cy-.68,.031),(cx+.7,cy+.2,.031),(cx-.3,cy+.5,.031)],[(0,1,2),(0,2,3)],stone[3])

# Ruined back / west walls, near walls cut low to keep the walk surface visible.
def wall_segment(name,x,y,length,height,west=False):
    depth=.40
    top=[height+random.uniform(-.20,.15) for _ in range(5)]
    vs=[]
    for yy in [-depth/2,depth/2]:
        vs += [(-length/2,yy,0),(length/2,yy,0)] + [(-length/2+i*length/4,yy,z) for i,z in enumerate(top)]
    faces=[(0,1,6,5,4,3,2),(7,9,10,11,12,13,8),(0,7,8,1),(0,2,9,7),(1,8,13,6)]
    faces += [(2+i,3+i,10+i,9+i) for i in range(4)]
    o=mesh(name,vs,faces,bone);o.location=(x,y,0)
    if west:o.rotation_euler.z=math.pi/2
    mod=o.modifiers.new('Chipped hard edges','BEVEL');mod.width=.065;mod.segments=1
    deselect();o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(stone[1]);o.data.materials.append(light)
    for face in o.data.polygons:
        if random.random()<.22:face.material_index=random.choice([1,2])
    obstacle(x,y,depth/2 if west else length/2,length/2 if west else depth/2)
    if height>1:
        for off in [-length*.35,length*.30]:
            px,py=(x,y+off) if west else (x+off,y)
            rod('Exposed bent rebar',(px,py,height-.2),(px+.06,py,height+.32),.015,rust,6)

for i in range(4):
    wall_segment('Back ruined wall',-4.9+i*3.25,6.45,3.15,random.uniform(1.9,2.7))
    wall_segment('West ruined wall',-6.45,-4.9+i*3.25,3.15,random.uniform(1.1,2.0),True)
    wall_segment('Near cutaway wall',-4.9+i*3.25,-6.45,3.15,.22)
    wall_segment('East cutaway wall',6.45,-4.9+i*3.25,3.15,.35,True)
text('A7',(.2,6.21,1.10),1.04,dark,(math.pi/2,0,0))
text('SALVAGE DEPOT',(.2,6.205,.72),.23,dark,(math.pi/2,0,0))
for x in [-5.5,-2.8,2.8,5.5]:
    rod('Steel upright',(x,6.66,0),(x,6.66,3.1),.065,rust,4)
    rod('Industrial rail',(x,6.66,2.9),(x+1.1,6.66,2.9),.045,dark,4)
for i in range(60):
    x=random.uniform(-8.1,8.1);y=random.choice([random.uniform(6.9,8.0),random.uniform(-8,-7)])
    rock('Outside rubble',(x,y,-.2),(random.uniform(.10,.38),random.uniform(.10,.4),random.uniform(.10,.4)),random.choice([sand,rust,stone[1]]))
for x,y,s in [(-8,3,2),(-7.6,7,2.2),(7.5,7.4,2.1),(-8,-5,1.1),(8,1,.9)]:
    rock('Angular desert outcrop',(x,y,-.3),(s,s*.7,s*.6),sand)

def cargo(x,y,num):
    box('Numbered cargo',(x,y,.63),(1.34,1.34,1.23),rust,.10)
    for xx in [-.63,.63]:
        for yy in [-.63,.63]:box('Charcoal corner guard',(x+xx,y+yy,.63),(.105,.105,1.22),dark,.024)
    for z in [.11,1.17]:
        box('Cargo rail',(x,y-.65,z),(1.25,.08,.08),dark,.018)
        box('Cargo rail',(x+.65,y,z),(.08,1.25,.08),dark,.018)
    text(str(num),(x,y-.69,.39),.45,white,(math.pi/2,0,0))
    text(str(num),(x,y,1.253),.50,white)
    obstacle(x,y,.69,.69)

cargo(-.8,-.8,1)
# One welded L-shaped silhouette, no vertical stacks.
for x,y in [(2.4,2.4),(4,2.4),(4,.8)]:
    box('L cargo continuous shell',(x,y,.48),(1.61,1.61,.90),rust,.045);obstacle(x,y,.805,.805)
for x,y in [(2.4,2.4),(4,.8)]:text('2',(x,y,.942),.52,white)
box('L cargo shared reinforcement',(3.2,2.4,.96),(2.85,.13,.06),dark,.015)

# Hollow dummy frame, distinct from real cargo at game scale.
x,y=-4,2.4
for z in [.12,1.02]:
    for dx in [-.48,.48]:box('Dummy frame',(x+dx,y,z),(.20,1.16,.20),stone[1],.025)
    for dy in [-.48,.48]:box('Dummy frame',(x,y+dy,z),(.82,.20,.20),stone[1],.025)
for dx in [-.48,.48]:
    for dy in [-.48,.48]:box('Dummy upright',(x+dx,y+dy,.57),(.20,.20,.9),stone[1],.02)
obstacle(x,y,.58,.58)

def goal(x,y,mat,num=None):
    for dx in [-1,1]:
        for dy in [-1,1]:
            box('Goal corner',(x+dx*.60,y+dy*.49,.055),(.12,.32,.065),mat,.014)
            box('Goal corner',(x+dx*.49,y+dy*.60,.055),(.32,.12,.065),mat,.014)
    if num:text(str(num),(x,y-.21,.033),.60,mat)
goal(-2.4,4,white,1);goal(2.4,-4,ochre,2)

def portal(x,y,mat):
    box('Portal pad',(x,y,.075),(1.43,1.43,.12),dark,.08)
    for sign in [-1,1]:
        box('Portal luminous edge',(x+sign*.59,y,.145),(.035,1.17,.02),mat)
        box('Portal luminous edge',(x,y+sign*.59,.145),(1.17,.035,.02),mat)
    vs=[(x-.56,y-.56,.14),(x+.56,y-.56,.14),(x+.56,y+.56,.14),(x-.56,y+.56,.14),(x+.07,y-.10,.26)]
    mesh('Portal faceted membrane',vs,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],mat)
portal(-4,-2.4,blue);portal(4,-4,orange)
box('Spike hazard base',(.8,-2.4,.08),(1.42,1.42,.10),dark,.02)
for dx in [-.42,0,.42]:
    for dy in [-.42,0,.42]:rod('Red hazard spike',(.8+dx,-2.4+dy,.13),(.8+dx,-2.4+dy,.49+random.random()*.16),.12,red,5,0)
obstacle(.8,-2.4,.71,.71)
for x,y in [(-2.4,.8),(-.8,2.4),(-4,-.8)]:
    mesh('Puddle polygon',[(x-.6,y-.5,.034),(x+.3,y-.55,.034),(x+.65,y+.12,.034),(x+.05,y+.58,.034),(x-.4,y+.31,.034)],[(0,1,2),(0,2,4),(2,3,4)],water)
for x,y in [(-5.6,4.8),(-4.8,5.6)]:
    rod('Rust barrel',(x,y,0),(x,y,.9),.29,rust,10)
    for z in [.15,.72]:rod('Barrel band',(x,y,z),(x,y,z+.055),.305,dark,10)
    obstacle(x,y,.305,.305)

# Broad chipped material islands, kept as geometry so the style needs no bitmap maps.
for i in range(95):
    x=random.uniform(-6,6);z=random.uniform(.13,1.65)
    w=random.uniform(.07,.36);h=random.uniform(.08,.29)
    if abs(x)<1.0 and z>.6:continue
    mesh('Back wall exposed aggregate',[(x,6.239,z),(x+w,6.239,z+.04),(x+w*.83,6.239,z+h),(x+w*.2,6.239,z+h*.75)],[(0,1,2),(0,2,3)],random.choice([stone[1],stone[2],sand,light]))
for i in range(65):
    y=random.uniform(-5.8,5.8);z=random.uniform(.15,.92);w=random.uniform(.08,.31);h=random.uniform(.06,.25)
    mesh('West wall broken surface',[(-6.239,y,z),(-6.239,y+w,z+.03),(-6.239,y+w*.7,z+h),(-6.239,y-.02,z+h*.8)],[(0,1,2),(0,2,3)],random.choice([stone[1],sand,light]))
for i in range(65):
    x=random.uniform(-5.8,5.8);y=random.uniform(-5.8,5.8)
    s=random.uniform(.05,.20)
    mesh('Scattered ground chips',[(x,y,.033),(x+s,y-.05,.033),(x+s*.6,y+s,.033)],[(0,1,2)],random.choice([stone[0],stone[5],sand]))
for y in [-3.5,.0,3.5]:
    rod('West rusty reinforcement',(-6.16,y,0),(-6.16,y,1.08),.045,rust,4)
    rod('West diagonal brace',(-6.15,y-.6,.12),(-6.15,y,1.0),.028,rust,4)
for x,y in [(-.8,-.8),(2.4,2.4),(4,.8)]:
    for i in range(18):
        px=x+random.uniform(-.55,.55);pz=random.uniform(.12,.82);w=random.uniform(.03,.14)
        mesh('Cargo paint abrasion',[(px,y-.675,pz),(px+w,y-.675,pz+.02),(px+w*.4,y-.675,pz+.085)],[(0,1,2)],random.choice([dark,bone,sand]))
for x,y,mat in [(-4,-2.4,blue),(4,-4,orange)]:
    for dx,dy in [(-.5,-.5),(.5,-.5),(.5,.5),(-.5,.5)]:
        rod('Membrane triangulation',(x+dx,y+dy,.15),(x+.07,y-.10,.272),.008,mat,4)

environment=list(bpy.data.objects)
deselect()
for o in environment:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'environment.glb'),export_format='GLB',use_selection=True,export_animations=False)
(OUT/'collision.json').write_text(json.dumps(dict(bounds=dict(x=6.17,z=6.17),obstacles=obstacles),indent=2))

# Original 1.90 m humanoid with seven-and-a-half head proportions, made of rigid armor.
# Each armor piece is rigidly weighted to one bone; mechanical joints stay separate.
before=set(bpy.data.objects)
parts=[]
def bind(o,bone_name):parts.append((o,bone_name));return o
def armor(name,loc,size,mat,bone_name,bevel=.04):return bind(box(name,loc,size,mat,bevel),bone_name)
def limb(name,a,b,r,mat,bone_name,r2=None):return bind(rod(name,a,b,r,mat,6,r2),bone_name)

armor('Pelvic chassis',(0,0,.99),(.33,.23,.22),dark,'hips')
armor('Pelvic armor',(0,.07,1.04),(.36,.17,.18),bone,'hips')
armor('Tapered rib cage',(0,0,1.36),(.45,.28,.34),bone,'spine',.07)
armor('Abdominal actuator',(0,0,1.15),(.22,.19,.21),dark,'spine',.03)
armor('Chest inset',(0,.146,1.36),(.29,.022,.17),dark,'spine',.012)
armor('Breastplate',(0,.167,1.405),(.27,.035,.10),light,'spine',.015)
armor('Chest yellow identifier',(-.126,.173,1.43),(.045,.012,.09),ochre,'spine',.004)
bind(text('07',(.055,.187,1.347),.06,white,(math.pi/2,0,math.pi)),'spine')
limb('Neck actuator',(0,0,1.51),(0,0,1.61),.065,dark,'neck')
armor('Faceted head',(0,.012,1.747),(.205,.23,.265),bone,'head',.065)
armor('Face mask',(0,.134,1.744),(.128,.046,.164),dark,'head',.025)
armor('Single yellow visor',(0,.161,1.772),(.047,.009,.099),ochre,'head',.006)
armor('Crown plate',(0,.002,1.872),(.14,.14,.018),light,'head',.009)
for side,s in [('L',1),('R',-1)]:
    # Joint centers: pelvis .99, knees .56, ankles .12; shoulder 1.47, elbow 1.18.
    thigh='thigh_'+side;shin='shin_'+side;foot='foot_'+side
    arm='arm_'+side;fore='forearm_'+side;hand='hand_'+side
    x=s*.126
    limb('Hip bearing',(x-.06,0,.965),(x+.06,0,.965),.075,dark,thigh)
    limb('Thigh inner strut',(x,0,.945),(x,0,.58),.066,dark,thigh)
    limb('Angular thigh armor',(x,.007,.905),(x,.009,.625),.103,bone,thigh,.071)
    armor('Thigh forward plate',(x,.066,.79),(.117,.055,.235),light,thigh,.022)
    limb('Knee hinge',(x-.08,0,.555),(x+.08,0,.555),.062,dark,shin)
    armor('Knee shield',(x,.079,.555),(.119,.051,.11),rust,shin,.025)
    limb('Tibia actuator',(x,0,.52),(x,0,.16),.041,dark,shin)
    limb('Shin hard shell',(x,.02,.49),(x,.02,.18),.081,bone,shin,.052)
    armor('Shin front ridge',(x,.073,.35),(.059,.035,.22),light,shin,.016)
    limb('Ankle',(x-.043,0,.125),(x+.043,0,.125),.045,dark,foot)
    armor('Heel',(x,-.015,.066),(.135,.165,.105),dark,foot,.026)
    armor('Human proportion boot',(x,.087,.063),(.145,.29,.10),bone,foot,.032)
    armor('Toe cap',(x,.196,.065),(.139,.092,.093),light,foot,.02)
    sx=s*.285;ex=s*.325;wx=s*.343
    limb('Shoulder hinge',(sx-.06,0,1.465),(sx+.06,0,1.465),.083,dark,arm)
    armor('Shoulder cap',(sx,0,1.47),(.19,.26,.20),bone,arm,.053)
    limb('Upper arm chassis',(sx,0,1.43),(ex,0,1.18),.05,dark,arm)
    limb('Upper arm armor',(sx,.005,1.397),(ex,.005,1.222),.073,bone,arm,.055)
    limb('Elbow bearing',(ex-.057,0,1.172),(ex+.057,0,1.172),.054,dark,fore)
    limb('Forearm strut',(ex,0,1.15),(wx,.015,.945),.038,dark,fore)
    limb('Forearm armor',(ex,.005,1.115),(wx,.02,.98),.072,bone,fore,.044)
    armor('Forearm yellow mark',(ex,.068,1.075),(.035,.012,.06),ochre,fore,.003)
    limb('Wrist coupling',(wx,.018,.975),(wx,.018,.91),.031,dark,hand)
    armor('Palm',(wx,.025,.878),(.085,.06,.105),dark,hand,.014)
    armor('Hand armor',(wx,-.013,.879),(.078,.02,.089),bone,hand,.009)
    for finger in range(4):
        fx=wx+(finger-1.5)*.02
        limb('Mechanical finger',(fx,.03,.835),(fx,.047,.781+abs(finger-1.5)*.008),.008,bone,hand)
    limb('Opposed thumb',(wx-s*.046,.025,.898),(wx-s*.066,.062,.846),.014,bone,hand)

deselect();bpy.ops.object.armature_add()
rig=bpy.context.object;rig.name='Salvage07_Rig'
bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
def add_bone(name,a,b,parent=None):
    eb=rig.data.edit_bones.new(name);eb.head=a;eb.tail=b
    if parent:eb.parent=rig.data.edit_bones[parent]
    return eb
add_bone('hips',(0,0,.98),(0,0,1.11))
add_bone('spine',(0,0,1.11),(0,0,1.51),'hips')
add_bone('neck',(0,0,1.51),(0,0,1.61),'spine')
add_bone('head',(0,0,1.61),(0,0,1.88),'neck')
for side,s in [('L',1),('R',-1)]:
    x=s*.126
    add_bone('thigh_'+side,(x,0,.965),(x,0,.555),'hips')
    add_bone('shin_'+side,(x,0,.555),(x,0,.125),'thigh_'+side)
    add_bone('foot_'+side,(x,0,.125),(x,.22,.065),'shin_'+side)
    add_bone('arm_'+side,(s*.285,0,1.465),(s*.325,0,1.172),'spine')
    add_bone('forearm_'+side,(s*.325,0,1.172),(s*.343,.018,.945),'arm_'+side)
    add_bone('hand_'+side,(s*.343,.018,.945),(s*.343,.03,.80),'forearm_'+side)
bpy.ops.object.mode_set(mode='OBJECT')
for o,bn in parts:
    deselect();o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    group=o.vertex_groups.new(name=bn);group.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Rigid mechanical binding','ARMATURE');mod.object=rig
    o.parent=rig
# One skinned mesh with shared material groups, instead of one draw call per armor part.
deselect()
for o,_ in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0][0]
bpy.ops.object.join()
bpy.context.object.name='Salvage07_RigidArmor'
for p in rig.pose.bones:p.rotation_mode='XYZ'
rig.animation_data_create()
for name,length in [('Idle',90),('Walk',30)]:
    rig.animation_data.action=None
    for f in range(length+1):
        phase=f/length*2*math.pi
        for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0)
        if name=='Idle':
            rig.pose.bones['spine'].rotation_euler.x=.013*math.sin(phase)
            rig.pose.bones['head'].rotation_euler.z=.035*math.sin(phase)
        else:
            rig.pose.bones['hips'].location.y=.018*(1-math.cos(phase*2))
            rig.pose.bones['spine'].rotation_euler.z=.035*math.sin(phase)
            for side,s in [('L',1),('R',-1)]:
                wave=math.sin(phase)*s
                rig.pose.bones['thigh_'+side].rotation_euler.x=.40*wave
                rig.pose.bones['shin_'+side].rotation_euler.x=-.58*max(0,-wave)
                rig.pose.bones['foot_'+side].rotation_euler.x=-.18*wave
                rig.pose.bones['arm_'+side].rotation_euler.x=-.29*wave
                rig.pose.bones['forearm_'+side].rotation_euler.x=.13+.10*max(0,wave)
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_euler',frame=f+1)
            p.keyframe_insert('location',frame=f+1)
    action=rig.animation_data.action;action.name=name;action.use_fake_user=True
    rig.animation_data.action=None
    track=rig.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,1,action);strip.action_slot=action.slots[0];track.mute=True
for track in rig.animation_data.nla_tracks:track.mute=False
scene.frame_set(1)
actor_objects=list(set(bpy.data.objects)-before)
deselect()
for o in actor_objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'robot.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True)
rig.location=(-2.4,-3.5,0)
scene.frame_end=90
bpy.ops.object.camera_add(location=(15,-19,16))
camera=bpy.context.object;camera.name='Orthographic ISO';camera.rotation_euler=(Vector((0,0,.1))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=22.0;scene.camera=camera
bpy.ops.object.light_add(type='SUN',location=(-6,-7,12))
sun=bpy.context.object;sun.rotation_euler=(.38,-.52,-.45);sun.data.energy=2.3;sun.data.angle=.035
scene.world=bpy.data.worlds.new('Warm studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.47,.43,.36,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'blender-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'faceted-salvage.blend'))
triangles=sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH')
(OUT/'manifest.json').write_text(json.dumps(dict(generator='Blender '+bpy.app.version_string,seed=107,source='Original procedural modeling; reference: 01 FACETED SALVAGE concept',actorHeight=1.9,bones=len(rig.data.bones),animations=['Idle','Walk'],objects=len(bpy.data.objects),polygons=triangles,gameplay=False),indent=2))
print('FACETED ASSETS COMPLETE',flush=True)
if '--render' in sys.argv:bpy.ops.render.render(write_still=True)
