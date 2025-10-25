// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-25.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q;
    p-=vec3(1.,.1,.1);
    q=p;
    float s=1.5;
    float e=0.;
    for(int j=0;j++<15;s*=e)
      p=sign(p)*(1.2-abs(p-1.2)),
      p=p*(e=8./clamp(dot(p,p),.3,5.5))+q*2.;
    return length(p)/s;
  }
