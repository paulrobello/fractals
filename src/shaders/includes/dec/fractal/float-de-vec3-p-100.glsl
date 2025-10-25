// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-100.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2., e;
    for(int i=0;i++<8;){
      p=.5-abs(p);
      p.x < p.z?p=p.zyx:p;
      p.z < p.y?p=p.xzy:p;
      s*=e=1.6;
      p=abs(p)*e-vec3(.5,30.0,5.0);
      p.yz*=rotate2D(.3);
    }
    return length(p.xy)/s-.005;
  }
