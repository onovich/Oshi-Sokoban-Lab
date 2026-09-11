import { SHALLOW_WATER_UPDATE } from './shallow-water-model';
// C: elevation + horizontal velocity. Same two passes and constants as the lab.
export const FLOW_STEP = `#version 300 es
precision highp float;
in vec2 uv; out vec4 result;
uniform sampler2D field, boundary, forcing;
uniform int pass, rainCount;
uniform vec2 drops[32];
const float dx=1./128.,dt=1./120.;
vec4 boundaryAt(vec2 p){return texture(boundary,p);}
bool solid(vec2 p){return p.x<dx||p.y<dx||p.x>1.-dx||p.y>1.-dx||boundaryAt(p).r>.5;}
vec4 sampleAt(vec2 p,vec4 c){return solid(p)?vec4(c.r,boundaryAt(p).gb,c.a):texture(field,p);}
void main(){
 vec4 c=texture(field,uv),wall=boundaryAt(uv);
 if(solid(uv)){result=vec4(0.,wall.gb,0.);return;}
 vec2 x=vec2(dx,0),y=vec2(0,dx);
 vec4 l=sampleAt(uv-x,c),r=sampleAt(uv+x,c),b=sampleAt(uv-y,c),t=sampleAt(uv+y,c);
 float divergence=(r.g-l.g+t.b-b.b)/(2.*dx);
 vec2 gradient=vec2(r.r-l.r,t.r-b.r)/(2.*dx);
 vec4 force=texture(forcing,uv);
 float edge=force.r;vec2 velocity=force.gb;
 if(wall.a>.5)c=vec4(0.);
 float impact=0.;
 for(int i=0;i<32;i++){if(i>=rainCount)break;vec2 delta=uv-drops[i];impact+=exp(-dot(delta,delta)/.00008);}
 ${SHALLOW_WATER_UPDATE}
}`;
