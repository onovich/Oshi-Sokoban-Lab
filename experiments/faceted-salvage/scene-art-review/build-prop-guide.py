import bpy, math
from mathutils import Vector
from pathlib import Path

OUT = Path(__file__).parent
def mat(name, color):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    node=m.node_tree.nodes.get('Principled BSDF'); node.inputs['Base Color'].default_value=(*color,1); node.inputs['Roughness'].default_value=.8
    return m
gray=mat('rough gray',(.24,.26,.26)); rust=mat('rust',(.42,.16,.075))
yellow=mat('ochre',(.85,.55,.08)); white=mat('bone',(.88,.87,.76)); floor=mat('floor',(.48,.48,.43))
def box(name, loc, scale, material, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        b=o.modifiers.new('edge','BEVEL'); b.width=bevel; b.segments=1
        o.modifiers.new('normals','WEIGHTED_NORMAL')
    return o
def digit(x,y,z):
    bpy.ops.object.text_add(location=(x,y,z))
    o=bpy.context.object; o.name='3 top points +Y baseline X'
    o.data.body='3'; o.data.align_x='CENTER'; o.data.align_y='CENTER'
    o.data.size=.61; o.data.extrude=.0003; o.data.materials.append(white)
def cube(x,y,z,material=gray):
    box('standard 1 CELL cube',(x,y,z+.5),(1,1,1),material)
    digit(x,y,z+1.004)
    for dx in [-.42,.42]:
        for dy in [-.42,.42]:
            box('flush yellow top corner',(x+dx,y+dy,z+.991),(.16,.16,.022),yellow,.004)
def reset():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def render(name,target,extent,width=1024,height=768):
    scene=bpy.context.scene
    bpy.ops.object.camera_add(location=Vector(target)+Vector((6,-8,9)))
    cam=bpy.context.object; cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO'; cam.data.ortho_scale=extent; scene.camera=cam
    bpy.ops.object.light_add(type='AREA',location=(0,-3,10)); bpy.context.object.data.energy=1500; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=8
    scene.world.color=(.5,.5,.5); scene.render.engine='CYCLES'; scene.cycles.samples=24
    scene.render.resolution_x=width; scene.render.resolution_y=height; scene.render.resolution_percentage=100
    scene.view_settings.view_transform='Standard'
    scene.render.filepath=str(OUT/name); bpy.ops.render.render(write_still=True)
reset()
# Row 0 is the far +Y row; missing upper-right cell is truly empty.
for x,y in [(0,1),(0,0),(1,0)]: cube(x,y,0,rust)
for x in [0,1]:
    for y in [0,1]: box('floor cell',(x,y,-.055),(.99,.99,.1),floor)
render('geometry-L.png',(.5,.5,.35),4.8)
reset()
# Camera-right world vector; each asset keeps identical WORLD orientation.
right=Vector((.8,.6,0))
for i in range(3):
    p=right*((i-1)*2.1); x,y=p.x,p.y
    # Thin surrounding floor patches leave a precise one-cell socket.
    for dx in [-1,0,1]:
        for dy in [-1,0,1]:
            if dx or dy: box('surrounding floor',(x+dx*.65,y+dy*.65,-.08),(.3 if dx else 1,.3 if dy else 1,.16),floor,.008)
    if i==0:
        box('fixed flush goal',(x,y,-.05),(1,1,.1),gray)
        digit(x,y,.004)
        for dx in [-.42,.42]:
            for dy in [-.42,.42]: box('fixed flush corner',(x+dx,y+dy,-.009),(.16,.16,.022),white,.004)
    elif i==1: cube(x,y,0)
    else: cube(x,y,-1)
render('geometry-goal-states.png',(0,0,.2),7.3,1536,768)
