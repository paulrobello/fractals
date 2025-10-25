// DEC SDF: Torus
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/torus.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float smallRadius = 1.; // minor radius
    float largeRadius = 2.; // major radius

    return length(vec2(length(p.xz) - largeRadius, p.y)) - smallRadius;
  }

Alternate method using circular line SDF - subtract minor radius from result

  float de(vec3 p){
    float r = 1.; // major radius
    float l = length(p.xz) - r;

    return length(vec2(p.y, l));
  }
