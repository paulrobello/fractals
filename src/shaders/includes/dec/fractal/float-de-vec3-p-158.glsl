// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-158.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q=p;
    float i,d=1.,c;
    Q.x+=M_PI/2.;
    c=dot(sin(Q),cos(Q.yzx))+1.;
    d=7.-length(p.xy);
    return d=(c+d-sqrt((c-d)*(c-d)+.2))*.5+snoise3D(p)*.1;
  }
