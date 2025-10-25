// DEC SDF: float pi = acos(-1.);
// Category: fractal | Author: butadiene
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-pi-acos-1.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

mat2 rot(float r){
  vec2 s = vec2(cos(r),sin(r));
  return mat2(s.x,s.y,-s.y,s.x);
}
float cube(vec3 p,vec3 s){
  vec3 q = abs(p);
  vec3 m = max(s-q,0.);
  return length(max(q-s,0.))-min(min(m.x,m.y),m.z);
}
float tet(vec3 p,vec3 offset,float scale){
  vec4 z = vec4(p,1.);
  for(int i = 0;i<12;i++){
    if(z.x+z.y<0.0)z.xy = -z.yx;
    if(z.x+z.z<0.0)z.xz = -z.zx;
    if(z.z+z.y<0.0)z.zy = -z.yz;
    z *= scale;
    z.xyz += offset*(1.0-scale);
  }
  return (cube(z.xyz,vec3(1.5)))/z.w;
}
float de(vec3 p){
  p.xy *= rot(pi);

  float np = 2.*pi/24.;
  float r = atan(p.x,p.z)-0.5*np;
  r = mod(r,np)-0.5*np;
  p.xz = length(p.xz)*vec2(cos(r),sin(r));

  p.x -= 5.1;
  p.xy *= rot(0.3);
  p.xz *= rot(0.25*pi);

  p.yz *= rot(pi*0.5);
  float s =1.;
  p.z = abs(p.z)-3.;
  p = abs(p)-s*8.;
  p = abs(p)-s*4.;
  p = abs(p)-s*2.;
  p = abs(p)-s*1.;
  vec3 col = vec3(0.082,0.647,0.894);
  return tet(p,vec3(1.0),1.8);
}
