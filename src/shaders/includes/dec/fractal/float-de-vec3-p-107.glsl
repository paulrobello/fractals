// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-107.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=sin(p+3.*sin(p*.5));
    float s=2., e;
    for(int i=0;i++<5;)
      p=abs(p-1.7)-1.3,
      s*=e=2./min(dot(p,p),1.5),
      p=abs(p)*e-1.;
    return length(p)/s;
  }
