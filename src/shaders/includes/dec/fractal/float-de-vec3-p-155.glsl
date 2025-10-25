// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-155.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    float d=1.,a;
    Q=p; d=a=1.;
    for(int j=0;j++<8;)
      d=min(d,(length(Q)-.5)/a),
      Q.xz*=rotate2D(ceil(atan(Q.z,Q.x)/1.05-.5)*1.05),
      Q.x-=1., a*=3., Q*=3.;
    return d;
  }
