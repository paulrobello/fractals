// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-30.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q;
    p.z-=1.5;
    q=p;
    float e=0.;
    float s=3.;
    for(int j=0;j++<8;s*=e)
      p=sign(p)*(1.-abs(abs(p-2.)-1.)),
      p=p*(e=6./clamp(dot(p,p),.3,3.))+q-vec3(8.0,.2,8.0);
    return length(p)/s;
  }
