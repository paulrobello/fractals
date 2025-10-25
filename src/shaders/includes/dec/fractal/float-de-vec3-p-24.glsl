// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-24.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2.;
    float e=0.;
    vec3 q=vec3(3.0,3.0,.0);
    for(int i=0; i++<7; p=q-abs(p-q*.4))
      s*=e=15./min(dot(p,p),15.),
      p=abs(p)*e-2.;
    return (length(p.xz)-.5)/s;
  }
