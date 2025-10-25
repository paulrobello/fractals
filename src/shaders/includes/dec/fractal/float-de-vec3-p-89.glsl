// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-89.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e=2., s=0., z=0.;
    for(int j=0;++j<6;p=abs(p)-1.5,e/=s=min(dot(p,p),.75),p/=s);
    z+=length(p.xz)/e;
    return z;
  }
