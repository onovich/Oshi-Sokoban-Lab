// Scheme B: passive optical relief advected by a projected horizontal flow.
// This is not a free-surface height or a conservative shallow-water solver.
export const FLOW_STEP = `#version 300 es
precision highp float;
in vec2 uv; out vec4 color;
uniform sampler2D field, pressure, boundary;
uniform int pass;
const float dx=1./128.,dt=1./120.;
vec4 edge(vec2 p){return texture(boundary,p);}
bool solid(vec2 p){return p.x<dx||p.y<dx||p.x>1.-dx||p.y>1.-dx||edge(p).r>.5;}
vec4 sampleAt(vec2 p,vec4 c){return solid(p)?vec4(c.r,edge(p).gb,c.a):texture(field,p);}
vec4 linearAt(vec2 q){
 vec2 grid=clamp(q,vec2(dx),vec2(1.-dx))/dx-.5;
 vec2 b=floor(grid),f=fract(grid),p=(b+.5)*dx;
 return mix(mix(texture(field,p),texture(field,p+vec2(dx,0)),f.x),
 mix(texture(field,p+vec2(0,dx)),texture(field,p+vec2(dx)),f.x),f.y);
}
float detail(vec2 p){return .006*sin(p.x*65.+1.7*sin(p.y*37.))*sin(p.y*57.+sin(p.x*31.))+.0015*sin(p.x*109.+p.y*83.);}
float pressureAt(vec2 p,float c){return solid(p)?c:texture(pressure,p).r;}
void main(){
 vec4 c=texture(field,uv),wall=edge(uv);
 if(solid(uv)){color=vec4(0.,wall.gb,0.);return;}
 if(pass==3){color=vec4(detail(uv),0.,0.,0.);return;}
 vec2 x=vec2(dx,0),y=vec2(0,dx);
 if(pass==0){
   vec2 back=uv-dt*c.gb;
   vec4 carried=solid(back)?c:linearAt(back);
   vec2 v=carried.gb*.996;
   // Moving base velocities entrain only adjacent fluid, not a drawn wake.
   vec2 force=vec2(0.);float weight=0.;
   for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++){
     vec4 e=edge(uv+vec2(float(i),float(j))*dx);
     float w=e.r*exp(-float(i*i+j*j)*.35);
     force+=e.gb*w;weight+=w;
   }
   if(weight>0.)v=mix(v,force/weight,min(.35,weight*.12));
   float h=wall.a>.5?detail(uv):mix(carried.r,detail(uv),.003);
   color=vec4(h,clamp(v,vec2(-1.),vec2(1.)),0.);return;
 }
 float p=texture(pressure,uv).r;
 float l=pressureAt(uv-x,p),r=pressureAt(uv+x,p),b=pressureAt(uv-y,p),t=pressureAt(uv+y,p);
 if(pass==1){
   float div=(sampleAt(uv+x,c).g-sampleAt(uv-x,c).g+sampleAt(uv+y,c).b-sampleAt(uv-y,c).b)/(2.*dx);
   color=vec4((l+r+b+t-div*dx*dx)*.25,0.,0.,0.);return;
 }
 color=vec4(c.r,clamp(c.gb-vec2(r-l,t-b)/(2.*dx),vec2(-1.),vec2(1.)),0.);
}`;
