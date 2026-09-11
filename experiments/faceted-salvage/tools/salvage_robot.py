import bpy,math,json,hashlib
from mathutils import Vector,Matrix,Quaternion
from art_geometry import *
from salvage_details import robot_details

def build(out):
    paint=mat('Robot bone armor',(.57,.525,.423),.22,.77)
    edge=mat('Robot exposed alloy',(.64,.59,.46),.55,.62)
    dark=mat('Robot graphite skeleton',(.028,.033,.037),.6,.57)
    yellow=mat('Robot worn ochre markings',(.72,.415,.042),.3,.7)
    rust=mat('Robot oxidation',(.245,.135,.065),.2,.9)
    black=mat('Recessed dark ports',(.010,.013,.016),.05,.8)
    parts=[];bones=[];mapping={};source_map={};source_child={}
    def B(name,a,b,parent,src=None,child=None):
        bones.append((name,Vector(a),Vector(b),parent));mapping[name]=name
        if src:source_map[name]=src
        if child:source_child[name]=child
    def P(o,bn):parts.append((o,bn));return o
    def plate(name,rings,bn,x=0,y=0,material=paint):
        o=panel(name,rings,material,.28);o.location.x=x;o.location.y=y;return P(o,bn)
    def bx(name,loc,size,bn,material=paint,bevel=.014):return P(box(name,loc,size,material,bevel,.6),bn)
    def tube(name,a,b,r,bn,material=dark,n=10,r2=None):return P(rod(name,a,b,r,material,n,r2,.3),bn)
    B('Hips',(0,0,1.0),(0,0,1.12),None,'pelvis','spine_01')
    B('Spine',(0,0,1.12),(0,0,1.28),'Hips','spine_01','spine_02')
    B('Chest',(0,0,1.28),(0,0,1.43),'Spine','spine_02','spine_03')
    B('UpperChest',(0,0,1.43),(0,0,1.55),'Chest','spine_03','neck_01')
    B('Neck',(0,0,1.55),(0,0,1.65),'UpperChest','neck_01','head')
    B('Head',(0,0,1.65),(0,0,1.92),'Neck','head')
    plate('Pelvis tapered girdle',[(.94,.25,.21,0),(1.055,.35,.24,0),(1.105,.30,.22,0)],'Hips',material=dark)
    for s in [-1,1]:
        bx('Floating pelvic cover',(s*.128,.094,1.025),(.115,.085,.135),'Hips',paint,.035)
    tube('Spinal hydraulic core',(0,0,1.08),(0,0,1.45),.074,'Spine')
    for z in [1.135,1.178,1.22]:bx('Layered abdominal vertebra',(0,.066,z),(.20,.08,.035),'Spine',dark,.012)
    plate('Ribcage sculpted taper',[(1.235,.215,.195,0),(1.39,.39,.26,0),(1.49,.43,.24,0),(1.54,.28,.21,0)],'Chest')
    plate('Front angular breast shield',[(1.285,.19,.035,.145),(1.415,.335,.045,.149),(1.49,.35,.04,.128)],'Chest',material=edge)
    bx('Chest serial ochre underlay',(.07,.177,1.448),(.12,.012,.059),'Chest',paint,.003)
    P(stencil('07',(.074,.187,1.419),.059,dark,(math.pi/2,0,math.pi)),'Chest')
    bx('Chest caution paint',(-.132,.176,1.447),(.043,.01,.078),'Chest',yellow,.006)
    for s in [-1,1]:
        bx('Chest lower mechanical cutout',(s*.137,.121,1.311),(.065,.06,.092),'Chest',black,.01)
        tube('Back piston',(s*.088,-.095,1.20),(s*.135,-.115,1.46),.018,'Chest',dark)
        bx('Rear scapular plate',(s*.107,-.136,1.433),(.15,.044,.17),'Chest',paint,.025)
    tube('Neck collar',(0,0,1.53),(0,0,1.65),.066,'Neck')
    for z in [1.56,1.59,1.62]:tube('Neck segment',(0,0,z),(0,0,z+.018),.074,'Neck',dark,8)
    # Slender, wedge-shaped head instead of the previous beveled cube.
    plate('Elongated faceted helmet',[(1.65,.106,.145,.006),(1.705,.15,.21,.016),(1.835,.205,.23,-.002),(1.913,.144,.185,-.015)],'Head')
    plate('Dark facial inset',[(1.695,.082,.025,.122),(1.817,.122,.033,.137),(1.877,.108,.022,.104)],'Head',material=dark)
    plate('Yellow vertical face marker',[(1.747,.038,.009,.146),(1.841,.055,.009,.151),(1.867,.052,.009,.129)],'Head',material=yellow)
    bx('Crown alloy strip',(0,-.001,1.916),(.105,.155,.017),'Head',edge,.01)
    for s in [-1,1]:
        tube('Temple circular bearing',(s*.087,-.027,1.794),(s*.108,-.027,1.794),.040,'Head',dark,12)
        tube('Temple bolt',(s*.109,-.027,1.794),(s*.118,-.027,1.794),.017,'Head',edge,8)
    for side,s,src in [('Left',-1,'l'),('Right',1,'r')]:
        thigh=side+'UpperLeg';shin=side+'LowerLeg';foot=side+'Foot';toe=side+'Toes'
        shoulder=side+'Shoulder';arm=side+'UpperArm';fore=side+'LowerArm';hand=side+'Hand'
        x=s*.123;sx=s*.267
        B(thigh,(x,0,.988),(x,0,.556),'Hips','thigh_'+src,'calf_'+src)
        B(shin,(x,0,.556),(x,0,.125),thigh,'calf_'+src,'foot_'+src)
        B(foot,(x,0,.125),(x,.17,.055),shin,'foot_'+src,'ball_'+src)
        B(toe,(x,.17,.055),(x,.27,.055),foot,'ball_'+src)
        B(shoulder,(s*.115,0,1.50),(sx,0,1.50),'UpperChest','clavicle_'+src,'upperarm_'+src)
        B(arm,(sx,0,1.50),(sx,0,1.185),shoulder,'upperarm_'+src,'lowerarm_'+src)
        B(fore,(sx,0,1.185),(sx,0,.936),arm,'lowerarm_'+src,'hand_'+src)
        B(hand,(sx,0,.936),(sx,.005,.833),fore,'hand_'+src,'middle_01_'+src)
        tube('Hip swivel',(x-.063,0,.988),(x+.063,0,.988),.074,thigh)
        tube('Exposed femur',(x,0,.947),(x,0,.60),.044,thigh)
        plate('Long anatomical thigh shell',[(.619,.115,.135,.013),(.75,.155,.155,.013),(.921,.188,.185,.005)],thigh,x)
        bx('Thigh center facet',(x,.098,.801),(.075,.024,.22),thigh,edge,.019)
        tube('Outer thigh piston',(x+s*.079,-.015,.67),(x+s*.079,-.015,.88),.012,thigh,edge,8)
        tube('Knee joint axle',(x-.072,0,.556),(x+.072,0,.556),.059,shin)
        for ss in [-1,1]:tube('Knee bolt',(x+ss*.070,0,.556),(x+ss*.082,0,.556),.024,shin,edge,8)
        bx('Angular kneecap',(x,.068,.561),(.103,.055,.116),shin,dark,.03)
        tube('Tibia actuator',(x,0,.516),(x,0,.145),.032,shin)
        plate('Tapered greave armor',[(.174,.086,.106,.018),(.34,.112,.122,.029),(.497,.148,.153,.019)],shin,x)
        bx('Greave center rib',(x,.092,.359),(.042,.028,.194),shin,edge,.012)
        tube('Ankle hinge',(x-.048,0,.13),(x+.048,0,.13),.038,foot)
        bx('Boot heel',(x,-.034,.058),(.121,.128,.10),foot,dark,.024)
        bx('Boot instep',(x,.067,.074),(.137,.185,.12),foot,paint,.034)
        bx('Split toe plate',(x,.204,.052),(.137,.139,.082),toe,edge,.025)
        bx('Rubber sole',(x,.108,.016),(.143,.33,.025),foot,dark,.008)
        tube('Shoulder ball',(sx-.056,0,1.5),(sx+.056,0,1.5),.072,arm)
        plate('Sloping deltoid armor',[(1.375,.12,.20,-.004),(1.485,.175,.23,0),(1.562,.12,.175,-.004)],arm,sx)
        tube('Humerus structural rod',(sx,0,1.405),(sx,0,1.212),.038,arm)
        plate('Upper arm long shell',[(1.227,.09,.12,.006),(1.33,.125,.141,.005),(1.408,.129,.15,.005)],arm,sx)
        tube('Elbow axle',(sx-.05,0,1.185),(sx+.05,0,1.185),.045,fore)
        tube('Ulna exposed strut',(sx,0,1.16),(sx,0,.955),.027,fore)
        plate('Forearm articulated vambrace',[(.969,.075,.10,.016),(1.07,.111,.137,.02),(1.148,.13,.14,.01)],fore,sx)
        bx('Forearm small ochre stripe',(sx,.092,1.074),(.025,.012,.061),fore,yellow,.004)
        tube('Wrist',(sx,0,.975),(sx,0,.923),.029,hand)
        bx('Palm skeleton',(sx,.004,.881),(.081,.048,.095),hand,dark,.012)
        bx('Dorsal hand armor',(sx,-.027,.885),(.077,.019,.084),hand,paint,.013)
        for fi,(fname,stem) in enumerate([('Index','index'),('Middle','middle'),('Ring','ring'),('Little','pinky'),('Thumb','thumb')]):
            if fi<4:
                fx=sx+(fi-1.5)*.019;points=[(fx,.009,.84),(fx,.017,.817),(fx,.024,.799),(fx,.034,.782)]
            else:points=[(sx-s*.044,.006,.901),(sx-s*.061,.016,.878),(sx-s*.063,.032,.859),(sx-s*.055,.045,.845)]
            prev=hand
            for j,suffix in enumerate(['Proximal','Intermediate','Distal']):
                bn=side+fname+suffix;sn=f'{stem}_{j+1:02d}_{src}'
                B(bn,points[j],points[j+1],prev,sn)
                tube('Finger phalanx',points[j],points[j+1],.0078 if fi<4 else .011,bn,edge,6)
                prev=bn
    robot_details(P,paint,edge,dark,yellow,rust,black)
    # Build standard names and a complete 52-bone deform hierarchy.
    select([]);bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='SalvageHumanoid'
    bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
    for name,a,b,parent in bones:
        eb=rig.data.edit_bones.new(name);eb.head=a;eb.tail=b
        eb.matrix=Matrix.LocRotScale(a,(b-a).to_track_quat('Y','Z'),Vector((1,1,1)));eb.length=(b-a).length
        if parent:eb.parent=rig.data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT');finish([o for o,_ in parts])
    for o,bn in parts:
        o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
        vg=o.vertex_groups.new(name=bn);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
    select([o for o,_ in parts]);bpy.ops.object.join();body=bpy.context.object;body.name='Salvage07_OriginalArmor'
    mod=body.modifiers.new('Mechanical rigid skin','ARMATURE');mod.object=rig;body.parent=rig
    # Rebind in a true T pose, while preserving the original modeled body.
    for side,s in [('Left',-1),('Right',1)]:
        p=rig.pose.bones[side+'UpperArm'];m=p.matrix.copy();pivot=p.head.copy()
        p.matrix=Matrix.Translation(pivot)@Matrix.Rotation(-s*math.pi/2,4,'Y')@Matrix.Translation(-pivot)@m
        bpy.context.view_layer.update()
    select([body]);bpy.ops.object.modifier_apply(modifier=body.modifiers[0].name)
    select([rig]);bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
    mod=body.modifiers.new('Humanoid skin','ARMATURE');mod.object=rig
    for p in rig.pose.bones:p.rotation_mode='QUATERNION'
    # Export neutral FBX first. It can be configured as Humanoid independently of WebGL.
    select([rig,body]);bpy.ops.export_scene.fbx(filepath=str(out/'SalvageHumanoid-Tpose.fbx'),use_selection=True,object_types={'ARMATURE','MESH'},add_leaf_bones=False,bake_anim=False,axis_forward='-Z',axis_up='Y')
    (out/'humanoid-map.json').write_text(json.dumps(mapping,indent=2))
    rest={b.name:b.matrix_local.copy() for b in rig.data.bones}
    source_path=out.parents[1]/'wasteland-3d'/'assets'/'blade-actor.blend'
    with bpy.data.libraries.load(str(source_path),link=False) as (src,dst):dst.objects=['Blade_KungFu']
    source=dst.objects[0];bpy.context.scene.collection.objects.link(source)
    clips={t.name:t.strips[0].action for t in source.animation_data.nla_tracks}
    for t in source.animation_data.nla_tracks:t.mute=True
    # Anatomical reference frames compensate FBX bone axes / posed reference skeleton.
    frames={}
    for name,sn in source_map.items():
        sb=source.data.bones.get(sn)
        if not sb:continue
        child=source.data.bones.get(source_child.get(name,''))
        if not child and sb.children:child=sb.children[0]
        if name=='Head':direction=Vector((0,0,1))
        elif child:direction=child.head_local-sb.head_local
        else:direction=Vector((0,.1,0))
        frames[name]=direction.to_track_quat('Y','Z').to_matrix().to_4x4()
    rig.animation_data_create();reports={}
    def set_arm_contact(side):
        # Retain the source push intent, stabilize palms against the box contact plane.
        arm=rig.pose.bones[side+'UpperArm'];fore=rig.pose.bones[side+'LowerArm'];hand=rig.pose.bones[side+'Hand']
        a=arm.head.copy();s=-1 if side=='Left' else 1;target=Vector((s*.22,.505,1.04))
        dvec=target-a;d=min(dvec.length,arm.length+fore.length-.006);direction=dvec.normalized()
        l1,l2=arm.length,fore.length;along=(l1*l1-l2*l2+d*d)/(2*d);h=math.sqrt(max(.000001,l1*l1-along*along))
        pole=Vector((s,-.1,-.35));pole=(pole-direction*pole.dot(direction)).normalized()
        elbow=a+direction*along+pole*h
        for p,head,tail in [(arm,a,elbow),(fore,elbow,target),(hand,target,target+Vector((0,.005,-.095)))]:
            p.matrix=Matrix.LocRotScale(head,(tail-head).to_track_quat('Y','Z'),Vector((1,1,1)));bpy.context.view_layer.update()
    for name in ['Idle','Walk','Push']:
        action=clips[name];source.animation_data.action=action;source.animation_data.action_slot=action.slots[0]
        rig.animation_data.action=None;min_feet=[];hand_samples=[]
        for frame in range(1,61):
            bpy.context.scene.frame_set(frame)
            for p in rig.pose.bones:p.matrix_basis=Matrix.Identity(4)
            bpy.context.view_layer.update()
            for p in rig.pose.bones:
                if p.name not in frames:continue
                sn=source_map[p.name];sp=source.pose.bones[sn];sb=source.data.bones[sn]
                delta=sp.matrix.to_quaternion().to_matrix().to_4x4()@sb.matrix_local.to_quaternion().to_matrix().to_4x4().inverted()
                q=(delta@frames[p.name]).to_quaternion()
                if p.parent:
                    head=p.parent.matrix@rest[p.parent.name].inverted()@rest[p.name].translation
                else:
                    offset=sp.head-sb.head_local
                    head=rest[p.name].translation+Vector((offset.x,offset.y,offset.z))*1.04
                p.matrix=Matrix.LocRotScale(head,q,Vector((1,1,1)));bpy.context.view_layer.update()
            if name=='Push':
                set_arm_contact('Left');set_arm_contact('Right')
            # Ground the support foot without discarding the source leg motion.
            deps=bpy.context.evaluated_depsgraph_get();evaluated=body.evaluated_get(deps)
            low=min(v.co.z for v in evaluated.data.vertices)
            hips=rig.pose.bones['Hips'];m=hips.matrix.copy();m.translation.z+=.025-low;hips.matrix=m
            bpy.context.view_layer.update()
            if name=='Push':set_arm_contact('Left');set_arm_contact('Right')
            for p in rig.pose.bones:
                p.keyframe_insert('location',frame=frame);p.keyframe_insert('rotation_quaternion',frame=frame);p.keyframe_insert('scale',frame=frame)
            hand_samples.append([list(rig.pose.bones[s+'Hand'].head) for s in ['Left','Right']])
            min_feet.append(float(low))
        new=rig.animation_data.action;new.name='Salvage_'+name;new.use_fake_user=True
        rig.animation_data.action=None;t=rig.animation_data.nla_tracks.new();t.name=name
        strip=t.strips.new(name,1,new);strip.action_slot=new.slots[0];t.mute=True
        reports[name]=dict(sourceAction=action.name,frames=60,palmRangeY=[min(h[1] for pair in hand_samples for h in pair),max(h[1] for pair in hand_samples for h in pair)])
    bpy.data.objects.remove(source,do_unlink=True)
    for t in rig.animation_data.nla_tracks:t.mute=False
    bpy.context.scene.frame_set(1);select([rig,body])
    bpy.ops.export_scene.gltf(filepath=str(out/'robot.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True)
    bpy.ops.export_scene.fbx(filepath=str(out/'SalvageHumanoid-Animated.fbx'),use_selection=True,object_types={'ARMATURE','MESH'},add_leaf_bones=False,bake_anim=True,bake_anim_use_all_actions=False,bake_anim_use_nla_strips=True,axis_forward='-Z',axis_up='Y')
    provenance=dict(mesh='Original modeled salvage robot; no Blade mesh or texture loaded',skeleton='52 mapped Humanoid bones, T-pose bind',sourceFile=str(source_path),sourceSHA256=hashlib.sha256(source_path.read_bytes()).hexdigest(),Idle='Reference task / Blade KungFu Idle',Walk='Reference task / Blade MOVE FORWARD IN PLACE',Push='Reference task authored Push, based on Blade lower-body gait; not a Blade-supplied push animation',retarget='Anatomical frame conversion with target limb lengths; foot grounding; push palm stabilization',reports=reports)
    (out/'motion-provenance.json').write_text(json.dumps(provenance,indent=2))
    return rig,body
