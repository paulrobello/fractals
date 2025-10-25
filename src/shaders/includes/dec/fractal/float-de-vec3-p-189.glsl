// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-189.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e=0.7;
  float s=5.0;
  float u;
  float t = 65.0; // time varying adjustment term
  for(int j=0;j++<12;p.xz=mod(p.xz-1.,2.)-1.)
    s/=u=dot(p,p),
    p/=-u,
    p.x=sin(t)*.25-p.x,
    p.z=cos(t)*.25-p.z,
    p.y+=1.75,
    e=min(e,p.y/s);
  return e;
}
