// DEC SDF: Box
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/box.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){ // cheap version
    vec3 size = vec3(1.); //dimensions on each axis
    vec3 d = abs(p) - size;

    return max(max(d.x, d.y), d.z);
  }

  float de(vec3 p){
    vec3 size = vec3(1.); // dimensions on each axis
    vec3 d = abs(p) - size;
    vec3 md = min(d, vec3(0.0));

    return length(max(d, vec3(0.0))) + max(max(md.x, md.y), md.z);
  }
