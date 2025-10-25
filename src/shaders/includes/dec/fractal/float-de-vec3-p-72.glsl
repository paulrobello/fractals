// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-72.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,s=4.,l;
    vec3 q=p;
    for(int j=0;j++<9;)
      p=mod(p-1.,2.)-1.,
      l=1.2/dot(p,p),
      p*=l, s*=l;
    return abs(p.y)/s;
  }
