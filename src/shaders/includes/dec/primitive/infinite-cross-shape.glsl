// DEC SDF: Infinite cross shape
// Category: primitive | Author: tholzer
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/infinite-cross-shape.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float s = 0.2; // size of the cross members
    float da = max (abs(p.x), abs(p.y));
    float db = max (abs(p.y), abs(p.z));
    float dc = max (abs(p.z), abs(p.x));
    return min(da,min(db,dc)) - s;
  }
