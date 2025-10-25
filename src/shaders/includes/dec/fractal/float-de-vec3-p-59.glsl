// DEC SDF: float de(vec3 p){
// Category: fractal | Author: adapted from code by catzpaw
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-59.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float k = M_PI*2.;
    vec3 v = vec3(0.,3.,fract(k));
    return (length(cross(p=cos(p+v),p.zxy))-0.1)*0.4;
  }
