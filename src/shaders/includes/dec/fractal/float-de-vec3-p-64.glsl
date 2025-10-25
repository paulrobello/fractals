// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-64.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2., l=0.;
    p=abs(p);
    for(int j=0;j++<8;)
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.),
      p*=l=-1.3/dot(p,p),
      p-=.15, s*=l;
    return length(p)/s;
  }
