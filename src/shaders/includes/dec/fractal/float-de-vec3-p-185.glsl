// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: catzpaw
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-185.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float l, e, v;
  l=1.;
  for(int j=0;j++<8;l*=v)
    p=2.*clamp(p,-.8,.9)-p,
    p*=v=max(.9/dot(p,p),.7),
    p+=.13;
  return e=.1*p.y/l;
}
