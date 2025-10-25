// DEC SDF: Cylinder in the XZ plane
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/cylinder-in-the-xz-plane.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float r = 1.;
    float height = 1.;

    float d = length(p.xz) - r;
    d = max(d, abs(p.y) - height);

    return d;
  }
