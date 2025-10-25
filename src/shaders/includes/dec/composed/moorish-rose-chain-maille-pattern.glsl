// DEC SDF: // Moorish Rose Chain Maille Pattern
// Category: composed | Author: athibaul
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/moorish-rose-chain-maille-pattern.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define R(th) mat2(cos(th),sin(th),-sin(th),cos(th))
float dTorus(vec3 p, float r_large, float r_small) {
  float h = length(p.xy) - r_large;
  float d = sqrt(h*h + p.z*p.z) - r_small;
  return d;
}

float torusGrid(vec3 p, float r_small, float r_large, float angle, vec2 sep) {
  p += vec3(0.0,sep.y/2.,0.0);
  vec3 q = p - vec3(round(p.xy/sep)*sep,0) - vec3(0.0,sep.y/2.,0.0);
  q.yz *= R(angle);
  float d = dTorus(q, r_large, r_small);
  q = p - vec3(round(p.xy/sep)*sep,0) - vec3(0.0,-sep.y/2.,0.0);
  q.yz *= R(angle);
  d = min(d, dTorus(q, r_large, r_small));
  return d;
}

float de(vec3 p) {
  float d = 1e5;
  for(float i=0.;i<6.;i++) {
    vec3 q = p;
    q.xy *= R(2.*3.14159*i/6.);
    float angle = 0.55;
    float rt3 = sqrt(3.);
    vec2 sep = vec2(1.0,rt3);
    float r1 = 0.47, r2 = 0.04, shift=0.3;
    d = min(d, torusGrid(q-vec3(shift,0.0,0.0), r2, r1, angle, sep));
    d = min(d, torusGrid(q-vec3(shift,0.0,0.0)-vec3(0.5,rt3/2.,0.0), r2, r1, angle, sep));
  }
  return d;
}
