// DEC SDF: float de( vec3 p ) {
// Category: primitive | Author: blackle
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/float-de-vec3-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float w = 1.0f;
  float t = 0.01f;
  return length(vec2(p.x * p.y * p.z, length(p) - w)) - t;
}

