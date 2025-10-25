// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-153.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q,S;
    Q=S=p;
    float a=1.,d;
    for(int j=0;j++<9;a=a/d+1.)
      Q=2.*clamp(Q,-.6,.6)-Q,
      d=clamp(dot(Q,Q),.1,1.)*.5,
      Q=Q/d+S;
    return d=(length(Q)-9.)/a;
  }
