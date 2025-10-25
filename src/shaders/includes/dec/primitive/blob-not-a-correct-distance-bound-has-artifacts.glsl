// DEC SDF: Blob - not a correct distance bound, has artifacts
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/blob-not-a-correct-distance-bound-has-artifacts.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p) {
    p = abs(p);
    if (p.x < max(p.y, p.z)) p = p.yzx;
    if (p.x < max(p.y, p.z)) p = p.yzx;
    float b = max(max(max(
      dot(p, normalize(vec3(1.0, 1.0, 1.0))),
      dot(p.xz, normalize(vec2(PHI+1, 1.0)))),
      dot(p.yx, normalize(vec2(1.0, PHI)))),
      dot(p.xz, normalize(vec2(1.0, PHI))));
    float l = length(p);
    return l - 1.5 - 0.2 * (1.5 / 2)* cos(min(sqrt(1.01 - b / l)*(PI / 0.25), PI));
  }
