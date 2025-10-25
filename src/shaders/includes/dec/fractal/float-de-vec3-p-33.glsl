// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-33.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.z-=1.5;
    vec3 q=p;
    float s=1.5;
    float e=0.;
    for(int j=0;j++<8;s*=e)
      p=sign(p)*(1.2-abs(p-1.2)),
      p=p*(e=8./clamp(dot(p,p),.6,5.5))+q-vec3(.3,8.0,.3);
    return length(p)/s;
  }
