// DEC SDF: Plane
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/plane.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    vec3 n = vec3(0.,1.,0.);       // plane's normal vector
    float distanceFromOrigin = 0.; // position along normal

    return dot(p, n) + distanceFromOrigin;
  }
