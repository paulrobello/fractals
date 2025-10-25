// DEC SDF: float de(vec3 p) {
// Category: fractal | Author: illus0r (modified)
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-198.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p *= 0.1;
  float sc,s,j;
  float z=p.z;
  p.x=mod(p.x+.06,.12)-.06;
  p.z=mod(p.z,.12)-.06-.5;
  p.y+=.613+.175;
  p.x-=.5;
  sc=1.;
  for(j=0.;j++<9.;){
    p=abs(p);
    p-=vec2(.5,.3).xyx;
    float dist = dot(p,p);
    s=2./clamp(dist,.1,1.);
    p*=s;
    sc*=s;
    p-=vec3(0.,5.-pow(1.0,5.)*.08,0.);
  }
  return ((length(p)-4.)/sc)/0.1;
}
