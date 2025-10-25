// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-105.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=5., e;
    p=p/dot(p,p)+1.;
    for(int i=0;i++<8;p*=e)
      p=1.-abs(p-1.),
      s*=e=1.6/min(dot(p,p),1.5);
    return length(cross(p,normalize(vec3(1.0))))/s-5e-4;
  }
