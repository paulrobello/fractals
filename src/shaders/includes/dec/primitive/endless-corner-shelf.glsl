// DEC SDF: Endless Corner/Shelf
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/endless-corner-shelf.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    vec2 p0 = p.xy; // the plane the section lies in
    vec2 md = min(p.xy, vec2(0.0));

    return length(max(p0, vec2(0.0))) + max(max(md.x, md.y), md.z);
  }
