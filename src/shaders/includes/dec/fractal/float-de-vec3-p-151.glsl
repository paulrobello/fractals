// DEC SDF: float de(vec3 p){
// Category: fractal | Author: adapted from code by kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-151.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q,S;
    float d=1., a;
    Q=S=mod(p,10.)-5.;
    a=1.;
    for(int j=0;j++<9;) // max(_, 0.001) added to deal with divide by zero
      Q=2.*clamp(Q,-1.,1.)-Q,
      d=max(3./max(dot(Q,Q),0.001),1.),
      Q=2.*Q*d+S,
      a=2.*a*d+1.;
    return d=(length(Q)-9.)/max(a,0.001);
  }
