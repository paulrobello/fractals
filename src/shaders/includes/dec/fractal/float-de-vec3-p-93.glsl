// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-93.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g=.3,e,s=2.,q;
    for(int i=0;i++<7;p=vec3(2.0,5.0,1.0)-abs(abs(abs(p)*e-3.)-vec3(2.0,5.0,1.0)))
      s*=e=12./min(dot(p,p),12.);
    return min(1.,length(p.xz)-.2)/s;
  }
