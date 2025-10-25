// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-108.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define M(p)p=vec2(sin(atan(p.x,p.y)*4.)/3.,1)*length(p),p.y-=2.
    float i,g,e,s;
    for(s=3.;s<4e4;s*=3.)
      M(p.xy),
      M(p.zy),
      p*=3.;
    return length(p.xy)/s-.001;
  }
