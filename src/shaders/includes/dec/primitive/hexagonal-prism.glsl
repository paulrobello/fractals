// DEC SDF: Hexagonal Prism
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/hexagonal-prism.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

Circumcircle Variant

  float de(vec3 p){
    float width = 1.;
    float height = 1.;

    return max(q.y - height, max(q.x*sqrt(3)*0.5 + q.z*0.5, q.z) - width);
  }

Incircle Variant

  float de(vec3 p){
    float width = 1.;
    float height = 1.;
    vec3 q = abs(p);

    return max(q.y - height, max(q.x*sqrt(3)*0.5 + q.z*0.5, q.z) - (width*sqrt(3)*0.5));
  }
