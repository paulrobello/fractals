// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-92.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2., e=0.;
    for(int i=0;i++<8;p=abs(p)*e)
      p=vec3(.8,2.0,1.0)-abs(p-vec3(1.0,2.0,1.0)),
      s*=e=1.3/clamp(dot(p,p),.1,1.2);
    return min(length(p.xz),p.y)/s+.001;
  }
