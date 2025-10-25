// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-173.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e, s=6., u=0.0;
  for(int j=0;j++<7;p=mod(p+1.,2.)-1.)
    s/=u=dot(p,p),
    p/=u;
  return e=dot(p,p)/s-abs(p.y)/s;
}
