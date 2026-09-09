export const WATER_VERTEX = `#version 300 es
in vec2 a_position;
out vec2 uv;
void main(){uv=vec2(a_position.x*.5+.5,.5-a_position.y*.5);gl_Position=vec4(a_position,0.,1.);}`;

export const WATER_FRAGMENT = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform sampler2D u_reflection;
uniform sampler2D u_floor;
uniform sampler2D u_flow;
uniform float u_flowEnabled;
uniform float u_time;
uniform float u_aspect;
uniform vec4 u_impulses[32];

float flowDetail(vec2 p){
  vec2 grid=clamp(p,vec2(1./128.),vec2(127./128.))*128.-.5;
  vec2 b=floor(grid),f=fract(grid),q=(b+.5)/128.;
  return mix(mix(texture(u_flow,q).r,texture(u_flow,q+vec2(1./128.,0)).r,f.x),
    mix(texture(u_flow,q+vec2(0,1./128.)).r,texture(u_flow,q+vec2(1./128.)).r,f.x),f.y);
}

void main(){
  float floorMask=texture(u_floor,uv).r;
  if(floorMask<.1){color=vec4(0.);return;}
  vec2 p=uv*vec2(u_aspect,1.);
  // Low amplitude capillary undulation, with expanding, decaying impact wavefronts.
  vec2 normal=vec2(cos(p.x*34.+p.y*19.+u_time*.7),sin(p.y*39.-p.x*13.-u_time*.6))*.08;
  if(u_flowEnabled>.5){
    normal=vec2(flowDetail(uv+vec2(1./128.,0))-flowDetail(uv-vec2(1./128.,0)),
      flowDetail(uv+vec2(0,1./128.))-flowDetail(uv-vec2(0,1./128.)))*100.;
  }
  float crest=0.;
  for(int i=0;i<32;i++){
    vec4 impulse=u_impulses[i];
    float age=impulse.z;
    if(age<0. || age>1.4)continue;
    // Same board-space projection as the SVG splash: rx=10, ry=3.
    // Do not aspect-correct this back into a screen-space circle.
    vec2 delta=(uv-impulse.xy)*vec2(1.,1./.3);
    float d=length(delta);
    float front=d-age*.12;
    float envelope=exp(-front*front/.00006)*exp(-age*2.8)*impulse.w;
    float wave=cos(front*240.)*envelope;
    normal+=delta/max(d,.002)*vec2(1.,.3)*wave*.5;
    crest+=wave;
  }
  vec2 offset=normal*vec2(.009,.004);
  vec4 reflection=texture(u_reflection,clamp(uv+offset,vec2(.001),vec2(.999)));
  // Slightly rough reflection with narrow moving highlights, not an opaque blue floor.
  vec4 blurred=texture(u_reflection,clamp(uv+offset+vec2(.0015,0.),vec2(0.),vec2(1.)));
  reflection=mix(reflection,blurred,.3);
  float glint=pow(max(0.,dot(normalize(vec3(normal,.85)),normalize(vec3(-.25,-.3,1.)))),24.);
  float waterAlpha=.035+glint*.05+max(crest,0.)*.085;
  float reflectedAlpha=reflection.a*.24;
  float alpha=clamp(waterAlpha+reflectedAlpha,0.,.34)*floorMask;
  vec3 water=vec3(.32,.39,.40)*(waterAlpha)+reflection.rgb*reflectedAlpha;
  color=vec4(water/max(alpha,.001),alpha);
}`;
