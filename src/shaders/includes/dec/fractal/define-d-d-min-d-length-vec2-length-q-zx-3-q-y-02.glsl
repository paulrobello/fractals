// DEC SDF: #define D d=min(d,length(vec2(length(Q.zx)-.3,Q.y))-.02)
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-d-d-min-d-length-vec2-length-q-zx-3-q-y-02.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    vec3 Q;
    float i,d=1.;
    Q=abs(fract(p)-.5),
    Q=Q.x>Q.z?Q.zyx:Q,
    d=9.,    D,
    Q-=.5,   D,
    Q.x+=.5,
    Q=Q.xzy, D,
    Q.z+=.5,
    Q=Q.zxy, D;
    return d;
  }
