// DEC SDF: Infinite Cylinder - perpendicular to xz plane
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/infinite-cylinder-perpendicular-to-xz-plane.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float radius = 1.;
    return length(p.xz)-radius; // xy, yz for other directions
  }
