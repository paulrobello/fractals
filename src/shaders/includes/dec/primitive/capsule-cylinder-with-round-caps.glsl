// DEC SDF: Capsule - cylinder with round caps
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/capsule-cylinder-with-round-caps.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p)
    float r = 1.; // radius
    float c = 1.; // length
    return mix(length(p.xz) - r, length(vec3(p.x, abs(p.y) - c, p.z)) - r, step(c, abs(p.y)));
  }

Alternate method

  float de_line_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.);

    return length((ab*t + a) - p);
  }

  float de(vec3 p){
    vec3 a = vec3(0., -1., 0.); // location of top
    vec3 b = vec3(0.,  1., 0.); // location of bottom
    float r = 1.; // radius

    return de_line_segment(p, a, b) - r;
  }
