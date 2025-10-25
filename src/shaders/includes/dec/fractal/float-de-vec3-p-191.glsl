// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-191.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p++;
  float s=3.;
  float e=0.;
  for(int j=0;j++<12;p/=e)
    p=mod(p-1.,2.)-1.,
    p.xz*=rotate2D(PI/4.),
    e=dot(p,p)*.5,
    s/=max(e,0.001);
  return length(p.y)/max(s,0.001)-.7/max(s,0.001);
}

