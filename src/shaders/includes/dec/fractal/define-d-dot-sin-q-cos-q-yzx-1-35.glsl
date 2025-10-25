// DEC SDF: #define D dot(sin(Q),cos(Q.yzx))+1.35
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-d-dot-sin-q-cos-q-yzx-1-35.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    vec3 Q;
    float d = 0.;
    Q=p,  d=D,  Q.x+=M_PI;
    d=min(d,D), Q.y+=M_PI;
    d=max(abs(min(d,D)+snoise3D(Q*2.)*.05),.01);
    return d*.5;
  }
