// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-99.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2., e;
    for(int j=0;j++<8;){
      p=.1-abs(p-.2);
      p.x < p.z?p=p.zyx:p;
      s*=e=1.6;
      p=abs(p)*e-vec3(.1,3.0,1.0);
      p.yz*=rotate2D(.8);
    }
    return length(p.yx)/s-.04;
  }
