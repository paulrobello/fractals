// DEC SDF: float de(vec3 p) {
// Category: fractal | Author: unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-141.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec4 q = vec4(p - 1.0, 1.0);
    for(int i = 0; i < 5; i++) {
      q.xyz = abs(q.xyz + 1.0) - 1.0;
      q /= clamp(dot(q.xyz, q.xyz), 0.25, 1.0);
      q *= 1.15;
    }
    return (length(q.zy) - 1.2)/q.w;
  }
