// Independent algorithm sketches; references and scope: research/interactive-water-study.md.
export const vertex = `#version 300 es
in vec2 a; out vec2 uv;
void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const common = `#version 300 es
precision highp float;
in vec2 uv; out vec4 result;
uniform sampler2D stateTex; uniform sampler2D pressureTex;
uniform vec2 block; uniform vec2 oldBlock; uniform vec2 velocity;
uniform vec2 drop; uniform float rain; uniform int mode; uniform int pass;
const float dx=1./128.; const float dt=1./120.;
// Screen Y points upward. The hidden base extends back from the front's bottom edge.
// Front height .13; base depth .065 (half the height), half-depth .0325.
vec2 contactCentre(vec2 front){return front-vec2(0.,.0325);}
bool blockContact(vec2 q,vec2 front){return all(lessThan(abs(q-contactCentre(front)),vec2(.065,.0325)));}
bool wallContact(vec2 q){return abs(q.x-.24)<.045&&abs(q.y-.395)<.085;}
bool solid(vec2 q){return q.x<dx||q.y<dx||q.x>1.-dx||q.y>1.-dx||
  wallContact(q)||blockContact(q,block);}
vec2 wallVelocity(vec2 q){return blockContact(q,block)?velocity:vec2(0.);}
vec4 sampleState(vec2 q,vec4 centre){
 if(solid(q))return vec4(centre.r,wallVelocity(q),centre.a);
 return texture(stateTex,q);
}
// Explicit bilinear sample avoids requiring float-linear texture filtering support.
vec4 advect(vec2 q){vec2 grid=clamp(q,vec2(dx),vec2(1.-dx))/dx-.5;
 vec2 base=floor(grid),f=fract(grid);vec2 p=(base+.5)*dx;
 return mix(mix(texture(stateTex,p),texture(stateTex,p+vec2(dx,0)),f.x),
 mix(texture(stateTex,p+vec2(0,dx)),texture(stateTex,p+vec2(dx)),f.x),f.y);}
`;
export const step = common + `
// Optical micro-relief carried as a passive scalar, not a free-surface solver.
float microRelief(vec2 p){
 return .006*sin(p.x*65.+1.7*sin(p.y*37.))*sin(p.y*57.+sin(p.x*31.))
       +.0015*sin(p.x*109.+p.y*83.);
}
void main(){
 vec4 c=texture(stateTex,uv);
 if(solid(uv)){result=vec4(0.,wallVelocity(uv),0.);return;}
 if(mode==1&&pass==3){result=vec4(microRelief(uv),0.,0.,0.);return;}
 vec4 l=sampleState(uv-vec2(dx,0),c),r=sampleState(uv+vec2(dx,0),c);
 vec4 b=sampleState(uv-vec2(0,dx),c),t=sampleState(uv+vec2(0,dx),c);
 float divergence=(r.g-l.g+t.b-b.b)/(2.*dx);
 vec2 gradient=vec2(r.r-l.r,t.r-b.r)/(2.*dx);
 vec2 gap=max(abs(uv-contactCentre(block))-vec2(.065,.0325),0.);
 float edge=exp(-dot(gap,gap)/.00025);
 float entered=float(blockContact(uv,oldBlock));
 if(entered>.5)c=vec4(0.); // newly uncovered cells: simple refill, NOT conservative remapping
 float impact=rain*exp(-dot(uv-drop,uv-drop)/.00008);
 if(mode==0){
   float lap=(l.r+r.r+b.r+t.r-4.*c.r)/(dx*dx);
   float v=(c.g+dt*.0225*lap)*.996;
   vec2 outward=normalize(uv-contactCentre(block)+vec2(.00001));
   v+=dot(velocity,outward)*edge*.035+impact*.055;
   result=vec4(clamp((c.r+v*dt)*.998,-.08,.08),v,0.,0.);return;
 }
 if(mode==1){
   if(pass==0){
     vec2 backtrace=uv-dt*c.gb;
     vec4 transported=solid(backtrace)?c:advect(backtrace);
     vec2 v=mix(transported.gb,velocity,edge*.35)*.996;
     // Sparse diagnostic tracers are transported by the flow, not a water-height claim.
     float tracer=max(transported.a*.995,edge*length(velocity)*.25);
     // Slow replenishment offsets numerical diffusion; no scrolling time-based noise.
     float detail=mix(transported.r,microRelief(uv),.003);
     if(entered>.5)detail=microRelief(uv);
     result=vec4(detail,v,min(tracer,1.));return;
   }
   if(pass==1){
     float p=texture(pressureTex,uv).r;
     float pl=solid(uv-vec2(dx,0))?p:texture(pressureTex,uv-vec2(dx,0)).r;
     float pr=solid(uv+vec2(dx,0))?p:texture(pressureTex,uv+vec2(dx,0)).r;
     float pb=solid(uv-vec2(0,dx))?p:texture(pressureTex,uv-vec2(0,dx)).r;
     float pt=solid(uv+vec2(0,dx))?p:texture(pressureTex,uv+vec2(0,dx)).r;
     result=vec4((pl+pr+pb+pt-divergence*dx*dx)*.25,0.,0.,0.);return;
   }
   float p=texture(pressureTex,uv).r;
   float pl=solid(uv-vec2(dx,0))?p:texture(pressureTex,uv-vec2(dx,0)).r;
   float pr=solid(uv+vec2(dx,0))?p:texture(pressureTex,uv+vec2(dx,0)).r;
   float pb=solid(uv-vec2(0,dx))?p:texture(pressureTex,uv-vec2(0,dx)).r;
   float pt=solid(uv+vec2(0,dx))?p:texture(pressureTex,uv+vec2(0,dx)).r;
   result=vec4(c.r,clamp(c.gb-vec2(pr-pl,pt-pb)/(2.*dx),vec2(-1.),vec2(1.)),c.a);return;
 }
 // Linearized shallow water: elevation + horizontal velocity, staggered in two passes.
 // Constant base depth and damping, not full nonlinear SWE / wet-dry conservation.
 if(pass==0){
   vec2 v=(c.gb-dt*.9*gradient)*.992;
   v=mix(v,velocity,edge*.22);
   result=vec4(c.r,clamp(v,vec2(-1.),vec2(1.)),0.);
 }else{
   float h=c.r-dt*.025*divergence+impact*.0008;
   result=vec4(clamp(h*.999,-.02,.02),c.gb,0.);
 }
}`;
export const display = common + `
uniform float debugView;
uniform float footprintView;
void main(){
 // Reconstruct the low-resolution field only in the display pass. Physics stays unchanged.
 vec4 s=advect(uv);
 float l=advect(uv-vec2(dx,0)).r,r=advect(uv+vec2(dx,0)).r;
 float b=advect(uv-vec2(0,dx)).r,t=advect(uv+vec2(0,dx)).r;
 vec2 normal=vec2(r-l,t-b)*(mode==1?100.:70.);
 vec2 q=uv+normal*.018;
 vec3 floorColor=vec3(.105,.145,.15);
 // Crisp bed references make refraction visible; avoid the old blurry checker shading.
 vec2 gridDistance=abs(fract(q*8.-.5)-.5)/max(fwidth(q*8.),vec2(.0001));
 float grid=1.-smoothstep(.35,1.2,min(gridDistance.x,gridDistance.y));
 floorColor+=grid*.048;
 // Shared restrained reflection and glancing light, so solver differences stay visible.
 vec2 rp=vec2(q.x,(block.y-.065-q.y)/.38);
 float reflection=(1.-smoothstep(.061,.071,abs(rp.x-block.x)))*
   (1.-smoothstep(.10,.13,rp.y))*step(0.,rp.y);
 vec3 n=normalize(vec3(normal,1.));
 float light=pow(max(dot(n,normalize(vec3(-.28,.38,1.))),0.),48.);
 float fill=pow(max(dot(n,normalize(vec3(.5,-.3,1.))),0.),16.);
 vec3 color=floorColor+reflection*.23+light*vec3(.48,.56,.58)+fill*.075;
 if(mode==1)color+=vec3(.12,.27,.28)*s.a;
 if(debugView>.5){
   color=mode==1?vec3(.08)+vec3(abs(s.g)*2.,s.a,abs(s.b)*2.):
     vec3(.08)+vec3(max(s.r,0.)*40.,abs(s.r)*10.,max(-s.r,0.)*40.);
 }
 bool wallFace=abs(uv.x-.24)<.045&&abs(uv.y-.48)<.17;
 bool blockFace=all(lessThan(abs(uv-block),vec2(.065)));
 if(wallFace)color=footprintView>.5?mix(color,vec3(.17,.20,.20),.35):vec3(.17,.20,.20);
 if(blockFace)color=footprintView>.5?mix(color,vec3(.95,.94,.87),.22):vec3(.95,.94,.87);
 if(footprintView>.5&&(blockContact(uv,block)||wallContact(uv)))color=mix(color,vec3(.15,.8,.65),.65);
 result=vec4(color,1.);
}`;
