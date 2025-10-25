// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-29.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float g=1.;
    float e=0.;
    vec3 q=vec3(0.0);
    p.z-=1.;
    q=p;
    float s=2.;
    for(int j=0;j++<8;)
      p-=clamp(p,-.9,.9)*2.,
      p=p*(e=3./min(dot(p,p),1.))+q,
      s*=e;
    return length(p)/s;
  }
