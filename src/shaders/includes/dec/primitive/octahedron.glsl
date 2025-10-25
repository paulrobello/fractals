// DEC SDF: Octahedron
// Category: primitive | Author: Unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/octahedron.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float r = 1.; // radius

    return fGDF(p, r, 3, 6);
  }

With Exponent

  float de(vec3 p){
    float r = 1.; // radius
    float e = 1.; // exponent

    return fGDF(p, r, e, 3, 6);
  }
