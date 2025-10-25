// DEC SDF: vec4 sphere (vec4 z) {
// Category: composed | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/vec4-sphere-vec4-z.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float r2 = dot (z.xyz, z.xyz);
    if (r2 < 2.0)
      z *= (1.0 / r2);
    else z *= 0.5;
    return z;
  }
  vec3 box (vec3 z) {
    return clamp (z, -1.0, 1.0) * 2.0 - z;
  }
  float DE0 (vec3 pos) {
    vec3 from = vec3(0.0);
    vec3 z = pos - from;
    float r = dot (pos - from, pos - from) * pow (length (z), 2.0);
    return (1.0 - smoothstep (0.0, 0.01, r)) * 0.01;
  }
  float DE2 (vec3 pos) {
    vec3 params = vec3(0.5, 0.5, 0.5);
    vec4 scale = vec4(-20.0 * 0.272321);
    vec4 p = vec4(pos, 1.0), p0 = p;
    vec4 c = vec4(params, 0.5) - 0.5; // param = 0..1

    for (float i = 0.0; i < 10.0; i++) {
      p.xyz = box(p.xyz);
      p = sphere(p);
      p = p * scale + c;
    }
    return length(p.xyz) / p.w;
  }
  float de (vec3 pos) {
    return max (DE0(pos), DE2(pos));
  }
