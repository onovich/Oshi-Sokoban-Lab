"""Buildable hard-surface details: each assembly belongs to an existing deform bone."""
import math
from art_geometry import *

def robot_details(P,paint,edge,dark,yellow,rust,black):
    def bx(n,p,d,b,m=paint,bevel=.003):return P(box(n,p,d,m,bevel,.12),b)
    def ax(n,a,b,r,bone,m=dark,v=10):return P(rod(n,a,b,r,m,v),bone)
    def bolt(x,y,z,b,r=.009):
        ax('Captive washer',(x,y-.002,z),(x,y+.002,z),r*1.45,b,dark)
        ax('Hex socket fastener',(x,y+.002,z),(x,y+.007,z),r,b,edge,6)
        ax('Bolt center recess',(x,y+.007,z),(x,y+.008,z),r*.35,b,black,6)
    # Thin plates float above a structural frame, leaving readable dark seams.
    for s in [-1,1]:
        for z,x in [(1.455,.132),(1.372,.098)]:bolt(s*x,.177,z,'Chest',.009)
        bx('Clavicle inset seam',(s*.098,.13,1.518),(.12,.012,.009),'Chest',dark)
        bx('Clavicle ochre paint',(s*.094,.139,1.505),(.079,.008,.019),'Chest',yellow)
        ax('Waist exposed silver ram',(s*.078,.019,1.103),(s*.104,.029,1.268),.010,'Spine',edge)
        ax('Waist hydraulic sleeve',(s*.080,.019,1.109),(s*.091,.024,1.179),.018,'Spine',dark)
        bx('Hip belt attachment',(s*.190,-.010,1.047),(.050,.12,.083),'Hips',rust,.009)
        bx('Hip belt latch',(s*.191,.056,1.047),(.035,.013,.033),'Hips',edge)
        # Back service pack is low profile; split plates leave the spine accessible.
        bx('Scapula service inset',(s*.1,-.163,1.432),(.105,.016,.11),'Chest',dark,.009)
        bx('Scapula removable cover',(s*.1,-.175,1.436),(.091,.012,.081),'Chest',paint,.006)
        bx('Back identification stripe',(s*.1,-.183,1.449),(.082,.004,.024),'Chest',yellow)
        for z in [1.383,1.398,1.413]:bx('Scapula cooling louver',(s*.10,-.185,z),(.065,.007,.005),'Chest',black,.001)
    bx('Sacral floating shield',(0,.149,1.012),(.097,.026,.137),'Hips',paint,.015)
    for z in [1.16,1.204,1.248]:
        bx('Rear spinal vertebra',(0,-.09,z),(.071,.045,.027),'Spine',edge,.005)
    for s in [-1,1]:
        for z in [1.767,1.786,1.805]:
            bx('Cheek air inlet',(s*.064,.125,z),(.018,.009,.004),'Head',black,.001)
        ax('Temple retaining ring',(s*.116,-.027,1.794),(s*.123,-.027,1.794),.030,'Head',paint,12)
        ax('Temple recessed axle',(s*.123,-.027,1.794),(s*.129,-.027,1.794),.015,'Head',dark,8)
        for z in [1.719,1.859]:bolt(s*.048,.13,z,'Head',.0045)
    bx('Optical slit',(0,.159,1.838),(.038,.004,.008),'Head',black,.001)
    for side,s in [('Left',-1),('Right',1)]:
        x=s*.123;sx=s*.267;arm=side+'UpperArm';fore=side+'LowerArm';shin=side+'LowerLeg';thigh=side+'UpperLeg';foot=side+'Foot'
        # Paired clevis ears and a recessed axle communicate the hinge construction.
        for joint,z,cx,bn,r in [('Knee',.556,x,shin,.044),('Elbow',1.185,sx,fore,.032)]:
            for q in [-1,1]:
                bx(joint+' clevis ear',(cx+q*(r+.014),-.010,z),(.015,r*1.8,r*2.4),bn,paint,.007)
                ax(joint+' radial washer',(cx+q*(r+.023),0,z),(cx+q*(r+.030),0,z),r*.79,bn,edge,12)
                ax(joint+' axle cap',(cx+q*(r+.031),0,z),(cx+q*(r+.036),0,z),r*.51,bn,dark,8)
        for z in [.705,.874]:bolt(x,.109,z,thigh,.007)
        for z in [.265,.442]:bolt(x,.109,z,shin,.006)
        # Offset segmented cable runs follow one rigid section; they never bridge a flexing joint.
        for bn,cx,z0,z1,y in [(fore,sx,.98,1.145,-.066),(shin,x,.205,.479,-.06),(thigh,x,.66,.91,-.085)]:
            ax('Actuator barrel',(cx+s*.034,y,z0),(cx+s*.034,y,z0+(z1-z0)*.57),.014,bn,dark)
            ax('Actuator polished ram',(cx+s*.034,y,z0+(z1-z0)*.5),(cx+s*.034,y,z1),.007,bn,edge)
            for z in [z0,z1]:bx('Ram mounting eye',(cx+s*.034,y,z),(.031,.024,.025),bn,edge)
            for i in range(9):
                z=z0+(z1-z0)*i/8
                ax('Ribbed protected conduit',(cx-s*.031,y,z),(cx-s*.031,y,z+.008),.011,bn,dark,8)
        for z in [1.448,1.519]:bolt(sx,.119,z,arm,.007)
        bx('Shoulder ochre identification',(sx,.116,1.492),(.075,.007,.023),arm,yellow)
        for z in [1.019,1.118]:bolt(sx,.094,z,fore,.0055)
        for q in [-1,1]:
            ax('Shoulder retaining disc',(sx+q*.078,0,1.50),(sx+q*.086,0,1.50),.047,arm,dark,12)
            ax('Shoulder axial bolt',(sx+q*.087,0,1.50),(sx+q*.091,0,1.50),.014,arm,edge,6)
        for yy in [-.03,.03,.09]:bx('Instep segmented seam',(x,yy,.138),(.094,.007,.006),foot,dark,.001)
        for yy in [-.03,.055,.14,.23]:bx('Separate sole tread',(x,yy,.005),(.134,.04,.013),foot,dark)
        # Chips lie on the known flat front rib; do not float beyond tapered armor.
        for j,z in enumerate([.735,.784,.86]):
            px=x+(-.031 if j%2 else .027)
            P(mesh('Thigh chipped enamel',[(px,.1105,z),(px+.006,.1105,z+.005),(px+.002,.1105,z+.014)],[(0,1,2)],rust),thigh)

def wall_chunk(name,x,y,width,depth,height,axis,stone,fracture):
    """Extruded broken silhouette: exposed horizontal aggregate band and inset chips."""
    h=[height+random.uniform(-.15,.14) for _ in range(7)]
    h[random.randrange(1,6)]-=.18
    profile=[(-width/2,0),(width/2,0)]+[(width/2-i*width/6,h[6-i]) for i in range(7)]
    def v(a,d,z):return (x+a,y+d,z) if axis=='x' else (x+d,y+a,z)
    vs=[v(a,d,z) for d in [-depth/2,depth/2] for a,z in profile];n=len(profile)
    faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    o=mesh(name,vs,faces,stone,.18);o.data.materials.append(fracture)
    for i,f in enumerate(o.data.polygons):
        if i>=4:f.material_index=1
    # Broad crumbled face scars at the top, over intact large concrete faces.
    for i in range(6):
        a=-width/2+i*width/6;b=a+width/6
        front=-depth/2-.002 if axis=='x' else depth/2+.002
        verts=[v(a,front,h[i]),v(b,front,h[i+1]),v(b-.025,front,h[i+1]-.045),v(a+.035,front,h[i]-.14)]
        mesh('Exposed fractured concrete lip',verts,[(0,1,2,3)],fracture,.12)
    # Irregular shallow face loss exposes the aggregate without turning the wall into masonry.
    for j in range(5):
        a=random.uniform(-width*.42,width*.42);z=random.uniform(.09,max(.10,height-.14))
        rw=random.uniform(.035,.13);rh=random.uniform(.025,.11)
        front=-depth/2-.003 if axis=='x' else depth/2+.003
        verts=[v(a-rw,front,z),v(a-rw*.45,front,z+rh),v(a+rw*.7,front,z+rh*.8),v(a+rw,front,z-rh*.4),v(a,front,z-rh)]
        mesh('Localized exposed aggregate',verts,[(0,1,2,3,4)],fracture,.1)
    return o,max(h)
