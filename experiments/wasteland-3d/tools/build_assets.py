"""Reproducible Blender headless assets. Run from any directory with Blender 5.x."""
import bpy, math, random, json, pathlib, os
from mathutils import Vector, Matrix

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
SOURCE = pathlib.Path(os.environ.get('BLADE_SOURCE_ROOT', str(ROOT / 'source-blade'))) / 'Assets'
random.seed(37)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, color, metal=0, rough=.85):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m

def cube(name, loc, size, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        mod = o.modifiers.new('Worn edges', 'BEVEL'); mod.width=bevel; mod.segments=2
        o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return o

def cylinder(name, loc, radius, depth, material, vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object; o.name=name; o.data.materials.append(material)
    o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return o

def beam(name, a, b, width, material):
    a,b=Vector(a),Vector(b)
    o=cube(name,(a+b)*.5,(width,width,(b-a).length),material)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o

def label(text, loc, size, material, rotation=(0,0,0)):
    c=bpy.data.curves.new('stencil','FONT'); c.body=text; c.size=size; c.extrude=.001
    o=bpy.data.objects.new('Stencil '+text,c); bpy.context.collection.objects.link(o)
    o.location=loc; o.rotation_euler=rotation; c.materials.append(material)
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o.select_set(False)

def environment():
    reset()
    concrete=[mat('Concrete '+str(i),(.25+i*.022,.26+i*.021,.235+i*.02)) for i in range(5)]
    sand=mat('Desert dust',(.43,.345,.23)); dark=mat('Charcoal steel',(.09,.125,.13),.65,.5)
    rust=mat('Oxidized iron',(.37,.135,.062),.48); ochre=mat('Safety ochre',(.78,.49,.13),.25)
    paint=mat('Faded petrol paint',(.10,.25,.25),.4); pale=mat('Bone stencil',(.77,.74,.60))
    grass=mat('Dry scrub',(.30,.28,.145)); cracks=mat('Crack shadow',(.09,.087,.066))
    cube('Diorama foundation',(0,0,-.36),(25,21,.65),dark,.17)
    cube('Sand bed',(0,0,-.10),(24.8,20.8,.20),sand,.1)
    # Slabs are irregularly weathered but share a stable flat walking plane.
    for x in range(-6,6):
        for y in range(-5,5):
            cube('Concrete slab', (x*2+1,y*2+1,-.035),(1.975,1.975,.12),random.choice(concrete),.025)
            if random.random()<.30:
                px,py=x*2+.4,y*2+.3
                for k in range(3):
                    qx,qy=px+random.uniform(.15,.35),py+random.uniform(.13,.48)
                    beam('Hairline fracture',(px,py,.030),(qx,qy,.030),.014,cracks);px,py=qx,qy
    obstacles=[]
    def barrier(name,x,y,w,d,h,material):
        cube(name,(x,y,h/2),(w,d,h),material,.07)
        obstacles.append({'x':x,'z':-y,'hx':w/2,'hz':d/2})
    # Tall scenery remains on the far side of the initial camera.
    for x,w,h in [(-9,5,2.1),(-3.9,4.6,1.7),(2.3,4.2,2.8),(8.5,5.5,2.2)]:
        barrier('Broken perimeter',x,9.3,w,.55,h,concrete[1])
        for dx in [-w*.35,0,w*.35]:
            beam('Exposed rebar',(x+dx,9.3,h-.12),(x+dx+.09,9.25,h+.5),.027,rust)
        cube('Wall cap',(x,9.3,h),(w,.64,.16),concrete[3],.03)
    barrier('Low western wall',-11.7,2,.6,12,1.0,concrete[1])
    barrier('Freight container',-7.8,6.7,5.4,3.2,2.7,paint)
    for x in [(-10.35+i*.26) for i in range(21)]:
        cube('Container corrugation',(x,5.075,1.35),(.07,.10,2.45),paint,.015)
        cube('Roof corrugation',(x,6.7,2.75),(.07,3.1,.06),dark)
    for x in [-10.1,-7.8,-5.5]: cube('Container frame',(x,5.0,1.35),(.10,.1,2.6),rust)
    label('SECTOR  /  07',(-9.6,4.995,1.65),.33,pale,(math.pi/2,0,0))
    label('OSHI   SALVAGE',(-9.6,4.99,.65),.20,pale,(math.pi/2,0,0))
    # Elevated pipeline and scaffold.
    for x in [3.5,7.5,11.0]:
        for y in [7.3,8.3]:
            cube('Pipe trestle',(x,y,1.85),(.14,.14,3.7),dark)
        beam('Trestle diagonal',(x,7.3,.4),(x,8.3,3.1),.08,rust)
        beam('Trestle crossbar',(x,7.1,3.5),(x,8.5,3.5),.16,dark)
    for y in [7.5,8.1]:
        o=cylinder('Rust pipeline',(7.1,y,3.6),.18,8.7,rust);o.rotation_euler[1]=math.pi/2
        for x in [3,5,7,9,11]:
            o=cylinder('Pipe coupling',(x,y,3.6),.23,.09,dark);o.rotation_euler[1]=math.pi/2
    barrier('Generator',8.9,5.4,2.4,1.55,1.4,dark)
    cube('Generator shell',(8.9,5.4,1.0),(2.3,1.5,.7),ochre,.08)
    for x in [8.1+i*.15 for i in range(11)]:cube('Cooling slot',(x,4.64,1.05),(.055,.02,.42),dark)
    label('DANGER',(8.2,4.618,.4),.17,pale,(math.pi/2,0,0))
    # Barricades, drums, debris, and growth.
    for x,y in [(-5,-3),(5,2)]:
        barrier('Concrete barricade',x,y,2.7,.65,.85,concrete[2])
        cube('Hazard stripe backing',(x,y-.331,.51),(2.5,.014,.28),ochre)
        for dx in [-.95,-.5,-.05,.4,.85]:
            o=cube('Hazard stripe',(x+dx,y-.345,.51),(.16,.012,.29),dark);o.rotation_euler[1]=-.35
    for x,y in [(-10,3.5),(-9.1,3.7),(10.6,2.8),(10,1.8)]:
        cylinder('Oil drum',(x,y,.53),.37,1.04,rust)
        for z in [.12,.46,.9]:cylinder('Drum bands',(x,y,z),.38,.055,dark)
        obstacles.append({'x':x,'z':-y,'hx':.38,'hz':.38})
    for i in range(80):
        x=random.uniform(-11.3,11.3);y=random.choice([random.uniform(8,9),random.uniform(-9.8,-8.8)])
        o=cube('Loose rubble',(x,y,.09),(random.uniform(.06,.25),random.uniform(.08,.30),random.uniform(.08,.21)),random.choice(concrete),.02)
        o.rotation_euler[2]=random.uniform(0,6)
    for i in range(100):
        x=random.choice([random.uniform(-11.6,-10.6),random.uniform(10.8,11.6)])
        y=random.uniform(-9,8)
        for k in range(3):beam('Desert grass',(x,y,0),(x+random.uniform(-.15,.15),y+random.uniform(-.15,.15),random.uniform(.15,.4)),.018,grass)
    for x in [-3.8,3.8]:
        for y in range(-6,5):cube('Worn lane marking',(x,y,.033),(.085,.53,.008),ochre)
    label('PUSH  /  TEST YARD',(-3.3,-7.4,.04),.40,pale)
    label('07',(-10.5,-7,.04),1.7,ochre)
    # A crate master reused by the browser, with real geometry on every side.
    before=set(bpy.data.objects)
    cube('Crate body',(0,0,.64),(1.22,1.22,1.24),ochre,.06)
    for z in [.14,1.12]:
        for y in [-.615,.615]:cube('Crate rail',(0,y,z),(1.29,.07,.09),dark,.014)
        for x in [-.615,.615]:cube('Crate rail',(x,0,z),(.07,1.29,.09),dark,.014)
    for x in [-.59,.59]:
        for y in [-.59,.59]:cube('Crate corner',(x,y,.64),(.09,.09,1.27),dark,.014)
    for y in [-.631,.631]:
        beam('Crate diagonal',(-.45,y,.25),(.45,y,1.0),.06,rust)
    label('07',(-.27,-.641,.43),.4,pale,(math.pi/2,0,0))
    parts=set(bpy.data.objects)-before
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/'crate.glb'),export_format='GLB',use_selection=True)
    for o in parts:bpy.data.objects.remove(o,do_unlink=True)
    bpy.ops.object.camera_add(location=(18,-22,21))
    camera=bpy.context.object;camera.name='Orthographic ISO';camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=29;bpy.context.scene.camera=camera
    bpy.ops.object.light_add(type='SUN',location=(0,-6,12));sun=bpy.context.object
    sun.rotation_euler=(.5,-.5,-.5);sun.data.energy=2.4;sun.data.angle=.08
    scene=bpy.context.scene;scene.world=bpy.data.worlds.new('Dust atmosphere');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.35,.40,.42,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
    scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'wasteland.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/'environment.glb'),export_format='GLB',export_cameras=False,export_lights=False)
    (OUT/'collision.json').write_text(json.dumps({'bounds':{'x':11.5,'z':9.5},'obstacles':obstacles},indent=2))
    print('ENVIRONMENT COMPLETE',len(bpy.data.objects),flush=True)

def actor():
    reset()
    bpy.ops.import_scene.fbx(filepath=str(SOURCE/'Res_Runtime/KungFu/Mod_Role_KungFu1.fbx'))
    rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    rig.name='Blade_KungFu'
    meshes=[o for o in bpy.data.objects if o.type=='MESH']
    texture=bpy.data.images.load(str(SOURCE/'Res_Runtime/KungFu/Tex_Role_KungFu1_Diffuse.png'))
    for mesh in meshes:
        material=mat('Blade original diffuse',(.6,.6,.6),.15,.72)
        nodes=material.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=texture
        material.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
        mesh.data.materials.clear();mesh.data.materials.append(material)
    actions={}
    for name,path in [('Idle','Animations/IDLE.fbx'),('Walk','Animations/IN PLACE/MOVE FORWARD IN PLACE.fbx')]:
        before=set(bpy.data.objects)
        bpy.ops.import_scene.fbx(filepath=str(SOURCE/'Combat animations - Kung fu V1'/path))
        imported=set(bpy.data.objects)-before
        source=next(o for o in imported if o.type=='ARMATURE')
        original_action=source.animation_data.action
        # These files use a posed reference skeleton, not the model's bind pose.
        # Bake absolute source bone poses in metres into the model's local bones.
        # Copying their local quaternion curves would silently produce wrong limbs.
        rig.animation_data_create();rig.animation_data.action=None;rig.scale=(1,1,1)
        for frame in range(1,61):
            bpy.context.scene.frame_set(frame)
            for p in rig.pose.bones:
                if p.name not in source.pose.bones:continue
                m=source.matrix_world @ source.pose.bones[p.name].matrix
                loc,rot,scale=m.decompose()
                p.rotation_mode='QUATERNION'
                p.matrix=Matrix.LocRotScale(loc,rot,Vector((1,1,1)))
                bpy.context.view_layer.update()
                p.keyframe_insert('location',frame=frame)
                p.keyframe_insert('rotation_quaternion',frame=frame)
                p.keyframe_insert('scale',frame=frame)
        action=rig.animation_data.action;action.name=name;action.use_fake_user=True
        actions[name]=action
        rig.animation_data.action=None
        for o in imported:bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.actions.remove(original_action)
    rig.animation_data_create();rig.animation_data.action=actions['Walk'];rig.animation_data.action_slot=actions['Walk'].slots[0]
    rig.scale=(1,1,1)
    bpy.context.scene.render.fps=30
    # Sample the original gait, then pose the existing upper-body bones for pushing.
    samples=[]
    def point_bone(bone, child, target):
        bpy.context.view_layer.update()
        p=rig.pose.bones[bone];c=rig.pose.bones[child]
        delta=(c.head-p.head).rotation_difference(Vector(target)-p.head)
        p.matrix=Matrix.Translation(p.head) @ delta.to_matrix().to_4x4() @ Matrix.Translation(-p.head) @ p.matrix
        bpy.context.view_layer.update()
    for frame in range(1,61):
        bpy.context.scene.frame_set(frame)
        for side,sign in [('l',-1),('r',1)]:
            point_bone('upperarm_'+side,'lowerarm_'+side,(sign*.27,.22,1.20))
            point_bone('lowerarm_'+side,'hand_'+side,(sign*.25,.52,1.05))
            point_bone('hand_'+side,'middle_01_'+side,(sign*.25,.56,.94))
        samples.append({p.name:(p.location.copy(),p.rotation_quaternion.copy(),p.scale.copy()) for p in rig.pose.bones})
    rig.animation_data.action=None
    for frame,sample in enumerate(samples,1):
        for p in rig.pose.bones:
            p.rotation_mode='QUATERNION';p.location,p.rotation_quaternion,p.scale=sample[p.name]
            p.keyframe_insert('location',frame=frame);p.keyframe_insert('rotation_quaternion',frame=frame);p.keyframe_insert('scale',frame=frame)
    push=rig.animation_data.action;push.name='Push';actions['Push']=push
    rig.animation_data.action=None
    for name,action in actions.items():
        track=rig.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,1,action);strip.action_slot=action.slots[0]
    bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=60
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blade-actor.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/'actor.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True)
    (OUT/'actor-provenance.json').write_text(json.dumps({'source':'https://github.com/onovich/Blade','model':'Assets/Res_Runtime/KungFu/Mod_Role_KungFu1.fbx','texture':'Assets/Res_Runtime/KungFu/Tex_Role_KungFu1_Diffuse.png','Idle':'original Kung fu V1 IDLE.fbx','Walk':'original Kung fu V1 MOVE FORWARD IN PLACE.fbx; martial-arts forward gait','Push':'new experimental bone animation; original walking lower body with baked two-handed pushing upper body; not a Blade-supplied push clip'},indent=2))
    print('ACTOR COMPLETE',flush=True)

if __name__=='__main__':
    environment()
    actor()
