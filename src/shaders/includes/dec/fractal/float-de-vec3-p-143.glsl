// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-143.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q=abs(mod(p,1.8)-.9);
    float a=1.;
    float d=1.;
    for(int j=0;j++<8;)
      Q=2.*clamp(Q,-.9,.9)-Q,
      d=dot(Q,Q),
      Q/=d,
      a/=d;
    return (Q.x+Q.y+Q.z-1.3)/a/3.;
  }
