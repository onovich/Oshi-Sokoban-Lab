import bpy,bmesh,math,random
from mathutils import Vector,noise

def mat(name,rgb,metal=0,rough=.9,emit=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    c=m.node_tree.nodes.new('ShaderNodeVertexColor');c.layer_name='Color'
    m.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color'])
    if emit:
        p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=emit
    return m

def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    if objects:bpy.context.view_layer.objects.active=objects[0]

def mesh(name,verts,faces,material,wear=0):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);d.materials.append(material);o['wear']=wear
    return o

def box(name,loc,size,material,bevel=.015,wear=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);o['wear']=wear
    if bevel:
        mod=o.modifiers.new('Machined chipped bevel','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def rod(name,a,b,r,material,vertices=10,r2=None,wear=0):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(material);o['wear']=wear
    return o

def rock(name,loc,scale,material,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.rotation_euler=(random.random(),random.random(),random.random()*6)
    o.data.materials.append(material);o['wear']=.35
    return o

def stencil(body,loc,size,material,rot=(0,0,0)):
    select([]);d=bpy.data.curves.new('IndustrialStencil','FONT');d.body=body;d.size=size;d.extrude=.0005;d.align_x='CENTER'
    o=bpy.data.objects.new('Stencil_'+body,d);bpy.context.scene.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;d.materials.append(material)
    select([o]);bpy.ops.object.convert(target='MESH');return o

def panel(name,rings,material,wear=.5):
    # Polygonal armor cross sections: (z, width, depth, centerY), with octagonal chamfers.
    vs=[]
    for z,w,d,y in rings:
        vs += [(-w*.34,y-d*.5,z),(w*.34,y-d*.5,z),(w*.5,y-d*.28,z),(w*.5,y+d*.28,z),(w*.33,y+d*.5,z),(-w*.33,y+d*.5,z),(-w*.5,y+d*.28,z),(-w*.5,y-d*.28,z)]
    fs=[tuple(reversed(range(8))),tuple(range((len(rings)-1)*8,len(rings)*8))]
    for ring in range(len(rings)-1):
        for i in range(8):fs.append((ring*8+i,ring*8+(i+1)%8,(ring+1)*8+(i+1)%8,(ring+1)*8+i))
    return mesh(name,vs,fs,material,wear)

def colors(o,subdivide=0):
    if o.type!='MESH':return
    if subdivide:
        bm=bmesh.new();bm.from_mesh(o.data)
        bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=subdivide,use_grid_fill=True)
        bmesh.ops.triangulate(bm,faces=list(bm.faces),quad_method='BEAUTY');bm.to_mesh(o.data);bm.free()
    attr=o.data.color_attributes.get('Color') or o.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
    wear=o.get('wear',0)
    for f in o.data.polygons:
        base=o.data.materials[f.material_index].diffuse_color[:3]
        p=o.matrix_world@f.center
        # Clustered multi-scale erosion, rather than isolated decal triangles.
        a=noise.noise(Vector((p.x*7.1+13,p.y*7.1+8,p.z*7.1+21)))
        b=noise.noise(Vector((p.x*29+1,p.y*29+15,p.z*29+4)))
        c=noise.noise(Vector((p.x*2.5,p.y*2.5+11,p.z*2.5+6)))
        value=1+wear*(a*.20+c*.14)
        rgb=[max(.004,min(1,v*value)) for v in base]
        if wear and a*.7+b*.3 > .22:
            # Exposed dull metal / stone in broken patches, with small warm oxidation.
            t=min(.48,wear*.55)
            scar=(.11,.098,.072) if sum(base)>.65 else (.31,.235,.15)
            rgb=[v*(1-t)+scar[i]*t for i,v in enumerate(rgb)]
        for li in f.loop_indices:attr.data[li].color=(*rgb,1)
    o.data.update()

def finish(objects):
    bpy.context.view_layer.update()
    for o in objects:
        if o.type=='MESH':colors(o,2 if o.get('wear',0) else 0)
