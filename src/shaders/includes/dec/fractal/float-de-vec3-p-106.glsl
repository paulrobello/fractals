// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-106.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=3., e, offset = 1.; //offset can be adjusted
    for(int i=0;i++<8;p*=e)
      p=abs(p-vec3(1.0,3.0,1.5+offset*.3))-vec3(1.0,3.+offset*.3,2.0),
      p*=-1., s*=e=7./clamp(dot(p,p),.7,7.);
    return (p.z)/s+1e-3;
  }
