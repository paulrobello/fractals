// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-188.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e,s;
  p.y-=p.z*.6;
  e=p.y-tanh(abs(p.x+sin(p.z)*.5));
  for(s=2.;s<1e3;s+=s)
    p.xz*=rotate2D(s),
    e+=abs(dot(sin(p.xz*s),vec2(1.0)/s/4.));
  e=min(e,p.y)-1.3;
  return e;
}
