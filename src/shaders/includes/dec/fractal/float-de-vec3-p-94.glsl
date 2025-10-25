// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-94.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    float i,d=1.,a,b=sqrt(3.);
    Q=mod(p,b*2.)-b;
    a=1.; d=9.;
    for(int j=0;j++<7;){
      Q=abs(Q);
      d=min(d,(dot(Q,vec3(1.0)/b)-1.)/a);
      Q=Q*3.-6./b;a*=3.;
    }
    return d;
  }
