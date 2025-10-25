// DEC SDF: Cylinder6 using iq's change of distance metric
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/cylinder6-using-iq-s-change-of-distance-metric.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float diameter = 0.2;
    float height = 0.1;
    return max( length6(p.xz) - diameter, abs(p.y) - height );
  }
