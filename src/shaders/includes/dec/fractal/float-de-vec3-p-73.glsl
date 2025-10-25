// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-73.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,s=1.,l;
    vec3 q=p;
    for(int j=0;j++<4;)
      p=mod(p-1.,2.)-1.,
      l=2./dot(p,p),
      p*=l, s*=l;
    return length(p.xy)/s;
  }
