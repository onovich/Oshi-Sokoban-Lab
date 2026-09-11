import bpy,math,random,json
from art_geometry import *

def build(out):
    stone=mat('Weathered limestone',(.36,.32,.25));edge=mat('Fresh stone fractures',(.51,.46,.36));dust=mat('Clay soil',(.30,.185,.105))
    steel=mat('Charcoal iron',(.045,.049,.05),.45);rust=mat('Oxide red steel',(.32,.105,.045),.15)
    yellow=mat('Worn safety yellow',(.65,.37,.04),.15);ivory=mat('Ivory markings',(.76,.73,.63));grey=mat('Dummy cast iron',(.16,.17,.16),.25)
    red=mat('Red spike paint',(.42,.035,.012),.15);floor=mat('Concrete slab',(.275,.255,.215));wet=mat('Wet slab',(.11,.135,.14),.45,.23)
    blue=mat('Blue portal',(.025,.27,.74),.2,.3,.22);orange=mat('Amber portal',(.8,.16,.01),.2,.3,.22)
    obstacle=[];bodies=[];dynamic=[]
    def block(x,y,w,d):obstacle.append(dict(x=x,z=-y,hx=w/2,hz=d/2))
    box('Deep rubble foundation',(0,0,-.45),(13.9,13.9,.8),dust,.2,.8)
    for x in range(8):
        for y in range(8):
            xx,yy=(x-3.5)*1.6,(y-3.5)*1.6
            box('Individual worn slab',(xx,yy,-.055),(1.585,1.585,.15),floor,.023,.75)
            if random.random()<.38:
                px,py=xx+random.uniform(-.6,.1),yy+random.uniform(-.6,.1)
                for k in range(3):
                    nx,ny=px+random.uniform(.08,.26),py+random.uniform(.04,.18)
                    rod('Concrete hairline',(px,py,.025),(nx,ny,.025),.008,steel,4);px,py=nx,ny
    # Chunk-built ruins with jagged profiles, generous broken depth and steel supports.
    def wall(x,y,length,h,axis):
        segments=2
        for i in range(segments):
            width=length/segments;along=-length/2+(i+.5)*width
            height=h+random.uniform(-.20,.17)
            # Lower courses are broad slabs, upper course exposes individually fractured stone.
            loc=(x+along,y,height/2) if axis=='x' else (x,y+along,height/2)
            size=(width+.008,.60,height) if axis=='x' else (.60,width+.008,height)
            o=box('Broken concrete wall section',loc,size,stone,.075,.85)
            for k in range(4):
                t=-width/2+(k+.5)*width/4
                cap=(loc[0]+t,loc[1],height) if axis=='x' else (loc[0],loc[1]+t,height)
                rock('Jagged cap fracture',cap,(.29,.37,.12) if axis=='x' else (.37,.29,.12),edge)
            for z in [.45,.95,1.45,1.95]:
                if z<height-.15:
                    if axis=='x':rod('Mortar gap',(loc[0]-.2,y-.31,z),(loc[0]+.2,y-.31,z+.01),.008,steel,4)
                    else:rod('Mortar gap',(x+.31,loc[1]-.2,z),(x+.31,loc[1]+.2,z+.01),.008,steel,4)
        block(x,y,length,.64) if axis=='x' else block(x,y,.64,length)
    for x,h in [(-4.8,1.65),(-1.6,2.05),(1.6,2.7),(4.8,1.7)]:wall(x,6.55,3.1,h,'x')
    for y,h in [(-4.8,.65),(-1.6,1.0),(1.6,1.25),(4.8,1.65)]:wall(-6.55,y,3.1,h,'y')
    for x in [-4.8,-1.6,1.6,4.8]:wall(x,-6.55,3.1,.35,'x')
    for y in [-4.8,-1.6,1.6,4.8]:wall(6.55,y,3.1,.45,'y')
    # A7 large inset sign panel, iron columns, oxidized brackets.
    box('A7 monolithic sign',(1.6,6.19,1.53),(2.25,.11,2.05),stone,.08,.6)
    stencil('A7',(1.6,6.115,1.63),.9,steel,(math.pi/2,0,0))
    stencil('SALVAGE',(1.6,6.11,1.28),.26,steel,(math.pi/2,0,0))
    stencil('DEPOT',(1.6,6.11,.95),.26,steel,(math.pi/2,0,0))
    for x in [-6.1,-3.2,0,3.2,6.1]:
        box('I beam upright',(x,6.85,1.63),(.10,.12,3.4),rust,.012,.8)
        for dx in [-.09,.09]:box('I beam flange',(x+dx,6.85,1.63),(.04,.24,3.4),rust,.01,.7)
        rod('High retaining rail',(x,6.85,2.77),(min(6.1,x+2.4),6.85,2.77),.036,steel,4)
        for z in [.5,1.8]:
            box('Bolt plate',(x,6.1,z),(.27,.06,.26),rust,.018,.8)
            for dx in [-.07,.07]:rod('Hex fastener',(x+dx,6.05,z),(x+dx,6.025,z),.025,steel,6)
    for y in [-5,-2,1,4]:
        rod('West angle brace',(-6.2,y-.5,.1),(-6.2,y,.9),.045,rust,4)
        for k in range(3):rod('Bent exposed rebar',(-6.45,y+k*.15,1.15),(-6.43,y+k*.15,1.42+random.random()*.3),.012,rust,6)
    for i in range(190):
        side=random.randrange(4);t=random.uniform(-7,7);d=random.uniform(6.9,8.1)
        x,y=(t,d) if side==0 else (t,-d) if side==1 else (-d,t) if side==2 else (d,t)
        rock('Layered rubble apron',(x,y,-.20),(random.uniform(.12,.48),random.uniform(.12,.42),random.uniform(.08,.32)),random.choice([stone,edge,dust]),1)
    for x,y in [(-5.9,5),(-5.8,2),(5.9,4.8)]:
        for i in range(8):rock('Wall foot debris',(x+random.uniform(-.14,.14),y+random.uniform(-.6,.6),.12),(.16,.22,.18),stone)
    for x,y in [(-8,7),(8,7),(-8,-5)]:
        for k in range(4):rock('Faceted canyon strata',(x+random.uniform(-1,1),y+random.uniform(-1,1),-.55),(.85,1.1,.7),dust,1)
    # Floating connected bodies exported separately. World placement lives in collision.json.
    def save_body(id,shape,pos,draw):
        before=set(bpy.data.objects);draw();parts=list(set(bpy.data.objects)-before);finish(parts)
        select(parts);bpy.ops.export_scene.gltf(filepath=str(out/(id+'.glb')),export_format='GLB',use_selection=True,export_animations=False)
        for o in parts:o.location.x+=pos[0];o.location.y+=pos[1]
        dynamic.extend(parts);bodies.append(dict(id=id,x=pos[0],z=-pos[1],cells=shape))
    def cube_body():
        box('Solid numbered crate',(0,0,.60),(1.34,1.34,1.14),grey,.045,.75)
        for dx in [-.65,.65]:
            for dy in [-.65,.65]:box('Yellow edge protector',(dx,dy,.61),(.11,.11,1.23),yellow,.02,.6)
        for z in [.065,1.18]:
            for a in [-.64,.64]:
                box('Top perimeter reinforcement',(a,0,z),(.10,1.30,.08),yellow,.01,.7)
                box('Top perimeter reinforcement',(0,a,z),(1.30,.10,.08),yellow,.01,.7)
        for dy,rot in [(-.68,(math.pi/2,0,0)),(.68,(math.pi/2,0,math.pi))]:stencil('3',(0,dy,.36),.53,ivory,rot)
        stencil('3',(0,-.22,1.225),.50,ivory)
    save_body('crate',[dict(x=0,z=0,hx=.70,hz=.70)],(-.8,-.8),cube_body)
    def l_body():
        for x,y in [(0,0),(1.6,0),(1.6,-1.6)]:
            box('Welded L shell',(x,y,.59),(1.61,1.61,1.12),rust,.027,.85)
            for dx in [-.72,.72]:
                for dy in [-.72,.72]:box('L iron corner seam',(x+dx,y+dy,.59),(.042,.042,1.12),steel,.007,.6)
            for yy in [-.70,.70]:box('L top seam',(x,y+yy,1.165),(1.44,.07,.07),grey,.012,.7)
        for x,y in [(0,0),(1.6,-1.6)]:stencil('1',(x,y-.23,1.195),.52,ivory)
        box('One welded connecting brace',(.8,0,1.20),(2.96,.11,.04),ivory,.01,.75)
    save_body('l-cargo',[dict(x=0,z=0,hx=.81,hz=.81),dict(x=1.6,z=0,hx=.81,hz=.81),dict(x=1.6,z=1.6,hx=.81,hz=.81)],(2.4,2.4),l_body)
    def dummy():
        for z in [.10,1.02]:
            for s in [-.46,.46]:
                box('Dummy square frame',(s,0,z),(.22,1.14,.22),grey,.022,.8)
                box('Dummy square frame',(0,s,z),(.78,.22,.22),grey,.022,.8)
        for x in [-.46,.46]:
            for y in [-.46,.46]:box('Dummy structural post',(x,y,.57),(.22,.22,.95),grey,.023,.8)
    save_body('dummy',[dict(x=0,z=0,hx=.59,hz=.59)],(-4,2.4),dummy)
    def goal(x,y,m,n):
        for a in [-1,1]:
            for b in [-1,1]:
                box('Docking corner',(x+a*.59,y+b*.47,.055),(.13,.37,.08),m,.018,.2)
                box('Docking corner',(x+a*.47,y+b*.59,.055),(.37,.13,.08),m,.018,.2)
        stencil(str(n),(x,y-.22,.032),.61,m)
    goal(-2.4,4,ivory,1);goal(2.4,-4,yellow,2)
    for x,y,m in [(-4,-2.4,blue),(4,-4,orange)]:
        box('Portal platform',(x,y,.11),(1.48,1.48,.19),grey,.08,.75)
        for a in [-1,1]:
            box('Portal rim',(x+a*.61,y,.23),(.12,1.36,.17),steel,.035,.4)
            box('Portal rim',(x,y+a*.61,.23),(1.36,.12,.17),steel,.035,.4)
            for b in [-1,1]:box('Portal mounting block',(x+a*.60,y+b*.60,.255),(.27,.27,.21),grey,.04,.5)
        vs=[(x,y,.40)]
        for i in range(8):
            a=i*math.pi/4;vs.append((x+math.cos(a)*.53,y+math.sin(a)*.53,.25+random.random()*.07))
        m2=mat(m.name+' dark facets',tuple(v*.38 for v in m.diffuse_color[:3]),.25,.25,.18)
        for i in range(8):
            o=mesh('Crystalline membrane',[vs[0],vs[1+i],vs[1+(i+1)%8]],[(0,1,2)],m if i%3 else m2)
            rod('Luminous edge',vs[1+i],vs[1+(i+1)%8],.012,m,5)
    box('Spike base',(.8,-2.4,.09),(1.43,1.43,.15),grey,.03,.7)
    for dx in [-.43,0,.43]:
        for dy in [-.43,0,.43]:rod('Angular red spike',(.8+dx,-2.4+dy,.16),(.8+dx+.025,-2.4+dy,.50+random.random()*.24),.14,red,5,0,.4)
    block(.8,-2.4,1.43,1.43)
    for x,y in [(-2.4,.8),(-.8,2.4),(-4,-.8),(.8,-.8)]:
        # Connected irregular shallow water, broken around slab cracks.
        vs=[(x,y,.026)]
        for i in range(15):
            a=i*math.tau/15;r=random.uniform(.38,.76);vs.append((x+math.cos(a)*r,y+math.sin(a)*r,.026))
        mesh('Irregular wet footprint',vs,[(0,i+1,(i+1)%15+1) for i in range(15)],wet,.32)
    static=[o for o in bpy.data.objects if o not in dynamic]
    finish(static);select(static)
    bpy.ops.export_scene.gltf(filepath=str(out/'environment.glb'),export_format='GLB',use_selection=True,export_animations=False)
    config=dict(bounds=dict(x=6.14,z=6.14),obstacles=obstacle,bodies=bodies,spawn=dict(x=-.8,z=3.2))
    (out/'collision.json').write_text(json.dumps(config,indent=2))
    return static,dynamic
