// DEC SDF: #define X(V)d=min(d,length(V)-.13),
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-x-v-d-min-d-length-v-13.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float deee(vec3 p){
    vec3 R=p,Q;
    float d = 1.;
    Q=fract(R)-.5,
    X(Q.xy)
    X(Q.yz)
    X(Q.zx)
    d=max(d,.68-length(fract(R-.5)-.5));
    return d;
  }
