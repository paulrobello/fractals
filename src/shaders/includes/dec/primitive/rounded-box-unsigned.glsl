// DEC SDF: Rounded box - unsigned
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/rounded-box-unsigned.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    vec3 b = vec3(1.0,2.0,3.0); // box dimensions
    float r = 0.1;      // rounding radius
    return length(max(abs(p)-b, 0.0))-r;
  }
