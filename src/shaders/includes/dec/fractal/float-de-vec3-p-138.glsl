// DEC SDF: float de(vec3 p){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-138.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=3., e;
    s*=e=3./min(dot(p,p),20.);
    p=abs(p)*e;
    escape = 0.;
    for(int i=0;i++<12;){
      p=vec3(1.0,4.0,2.0)-abs(p-vec3(2.0,4.0,2.0)),
      s*=e=8./min(dot(p,p),12.),
      p=abs(p)*e;
      escape += exp(-0.2*dot(p,p));
    }
    return min(length(p.xz)-.1,p.y)/s;
  }
