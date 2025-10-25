// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-154.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    float i,d=1.,a;
    Q=abs(mod(p,1.8)-.9);
    a=3.;
    for(int j=0;j++<8;)
      Q=2.*clamp(Q,-.9,.9)-Q,
      d=dot(Q,Q),
      Q/=d,
      a/=d,
      Q+=.05;
    return d=(Q.x+Q.y+Q.z-1.6)/a;
  }
