// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-146.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,j,d=1.,a;
    vec3 Q;
    a=1.;
    d=p.y+1.;
    for(j=0.;j++<9.;)
      Q=(p+fract(sin(j)*1e4)*3.141592)*a,
      Q+=sin(Q)*2.,
      d+=sin(Q.x)*sin(Q.z)/a,
      a*=2.;
    return d*.15;
  }
