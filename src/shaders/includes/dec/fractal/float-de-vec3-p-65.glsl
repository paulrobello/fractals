// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-65.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.z-=20;
    float s=3., l=0.;
    p=abs(p);
    for(int j=0;j++<10;)
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.),
      p*=l=-1./max(.19,dot(p,p)),
      p-=.24, s*=l;
    return (length(p)/s);
  }
