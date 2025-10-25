// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-148.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    float i,j,d=1.,a;
    d=dot(sin(p),cos(p.yzx))+1.2;
    a=1.;
    for(j=0.;j++<9.;)
      Q=(p+fract(sin(j)*3e3)*9.)*a,
      Q+=sin(Q*1.05)*2.,
      Q=sin(Q),
      d+=Q.x*Q.y*Q.z/a*.4,
      a*=2.;
    return d*.4;
  }
