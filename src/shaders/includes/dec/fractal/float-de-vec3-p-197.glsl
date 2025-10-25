// DEC SDF: float de( vec3 p ) {
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-197.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.y+=-1.43;
  p.x+=-.1245;
  vec3 pos = p;
  p.y -=1.5;
  float sc=0.0,d=0.0,s=0.0,e=1.0;
  p.z = mod(p.z,2.)-1.;
  p.x = mod(p.x,2.)-1.;
  float DEfactor=1.;
  for (float j=0.; j<9.; j++){
    p=abs(p);
    p-=vec3(.5,2.,.5);
    float dist = dot(p,p);
    sc=2./clamp(dist,.1,1.);
    p*=sc;
    DEfactor*=sc;
    p-=vec3(0.,5.,0.);
  }
  float dd=(length(p)/DEfactor-.001);
  d+=e=dd*.3;
  return d;
}

