// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: tk87
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-201.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float d = 0;
  p.z+=.8;
  for(int i=0;++i<10;)
    p.y-=clamp(p.y,.0,.1),
    p=abs(p),
    p*=rotate3D(.4,vec3(1.0,.2,-1.0)),
    p*=1.1;
  d=length(p)-.02;
  d*=.39;
  return d;
}
