/** Shared verbatim by lab C and runtime; normalized basin coordinates. */
export const SHALLOW_WATER_UPDATE = `
 if(pass==0){
   vec2 v=(c.gb-dt*.9*gradient)*.992;
   v=mix(v,velocity,edge*.22);
   result=vec4(c.r,clamp(v,vec2(-1.),vec2(1.)),0.);
 }else{
   float h=c.r-dt*.025*divergence+impact*.0008;
   result=vec4(clamp(h*.999,-.02,.02),c.gb,0.);
 }
`;
export const SHALLOW_WATER_LIGHTING = `
 vec3 n=normalize(vec3(normal,1.));
 float light=pow(max(dot(n,normalize(vec3(-.28,.38,1.))),0.),48.);
 float fill=pow(max(dot(n,normalize(vec3(.5,-.3,1.))),0.),16.);
 vec3 surfaceLight=light*vec3(.48,.56,.58)+fill*.075;
`;
