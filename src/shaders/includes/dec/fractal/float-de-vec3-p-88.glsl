// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-88.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q=p;
    float s=5., e=0.;
    for(int j=0;j++<8;s*=e)
      p=sign(p)*(1.-abs(abs(p-2.)-1.)),
      p=p*(e=6./clamp(dot(p,p),.1,3.))-q*vec3(2.0,8.0,5.0);
    return length(p)/s;
  }
