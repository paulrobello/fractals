// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-116.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2.,e;
    for(int i=0;i<9;i++){
      p=.5-abs(p-.5);
      p.x < p.z?p=p.zyx:p;
      p.z < p.y?p=p.xzy:p;
      s*=e=2.4;
      p=abs(p)*e-vec3(.1,13.0,5.0);
    }
    return length(p)/s-0.01;
  }
