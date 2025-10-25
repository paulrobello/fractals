// DEC SDF: Torus8-2 using iq's change of distance metric (see operator section)
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/torus8-2-using-iq-s-change-of-distance-metric-see-operator-section.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p){
    vec2 t = vec2(1.0,0.2); // major and minor
    vec2 q = vec2(length2(p.xz)-t.x, p.y);
    return length8(q) - t.y;
  }
