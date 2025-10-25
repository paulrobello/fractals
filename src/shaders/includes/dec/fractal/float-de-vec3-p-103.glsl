// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-103.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=3., offset=8., e;
    for(int i=0;i++<9;p=vec3(2.0,4.0,2.0)-abs(abs(p)*e-vec3(4.0,4.0,2.0)))
      s*=e=max(1.,(8.+offset)/dot(p,p));
    return min(length(p.xz),p.y)/s;
  }
