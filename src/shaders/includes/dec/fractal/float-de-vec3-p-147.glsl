// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-147.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q,S;
    float i,d=1.,a;
    Q=S=mod(p,8.)-4.;
    a=1.;
    for(int j=0;j++<9;a=a/d+1.)
      Q=2.*clamp(Q,-.7,.7)-Q,
      d=clamp(dot(Q,Q),.5,1.)*.5,
      Q=Q/d+S;
    return max((length(Q)-6.)/a,dot(sin(p),cos(p.yzx))+1.2)*0.6;
  }
