// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-11.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
  float t = time, sc;
  p.xy*=rot(p.z*3.14/3.);
  vec3 pos = p;
  p.y -=1.5-sin(p.z+t)*.5;
  p.z = mod(p.z,2.)-1.;
  p.x = mod(p.x,2.)-1.;
  float DEfactor=1.;
  for (float j=0.; j<7.; j++){
    p=abs(p);
    p-=vec3(.5,2.,.5);
    float dist = dot(p,p);
    sc=2./clamp(dist,.1,1.);
    p*=sc;
    DEfactor*=sc;
    p-=vec3(0.,5.,0.);
  }
  float dd=(length(p)/DEfactor-.005);
  return dd*.5;
}
