// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-149.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    float i,j,d=1.,a;
    d=min(p.y,0.)+.3;
    a=1.;
    for(j=0.;j++<9.;)
      Q=(p+vec3(9.0,0.0,0.0)+fract(sin(j)*1e3)*6.283)*a,
      Q+=sin(Q)*2.,
      Q=sin(Q),
      d+=Q.x*Q.y*Q.z/a,
      a*=2.;
    return d*.3;
  }
