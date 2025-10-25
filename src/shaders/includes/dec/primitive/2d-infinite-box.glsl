// DEC SDF: 2d Infinite Box
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/2d-infinite-box.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){  // cheap version
    vec2 p0 = p.xy;    // the plane the box is in (xy, yz, xz)
    vec2 bd = vec2(1.); // the dimensions of the box
    vec2 d = abs(p0) - bd;

    return max(d.x, d.y);
  }

  float de(vec3 p){
    vec2 p0 = p.xy;    // the plane the box is in (xy, yz, xz)
    vec2 bd = vec2(1.); // the dimensions of the box
    vec2 d = abs(p0) - bd;
    vec2 md = min(d, vec2(0.));

    return length(max(d, vec2(0.0))) + max(max(md.x, md.y), md.z);
  }
