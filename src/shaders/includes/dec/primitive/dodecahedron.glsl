// DEC SDF: Dodecahedron
// Category: primitive | Author: Unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/dodecahedron.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float r = 1.; // radius

    return fGDF(p, r, 13, 18);
  }

With Exponent

  float de(vec3 p){
    float r = 1.; // radius
    float e = 1.; // exponent

    return fGDF(p, r, e, 13, 18);
  }
