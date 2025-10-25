// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-120.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=4., e;
    for(int i=0;i++<7;p.y-=10.)
      p.xz=.8-abs(p.xz),
      p.x < p.z?p=p.zyx:p,
      s*=e=2.5/clamp(dot(p,p),.1,1.2),
      p=abs(p)*e-1.;
    return length(p)/s+.001;
  }
