// DEC SDF: Cone - pointing up the y axis
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/cone-pointing-up-the-y-axis.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float radius = 1.;
    float height = 3.;
    vec2 q = vec2(length(p.xz), p.y);
    vec2 tip = q - vec2(0.0, height);
    vec2 mantleDir = normalize(vec2(height, radius));
    float mantle = dot(tip, mantleDir);
    float d = max(mantle, -q.y);
    float projected = dot(tip, vec2(mantleDir.y, -mantleDir.x));

    // distance to tip
    if ((q.y > height) && (projected < 0)) {
      d = max(d, length(tip));
    }

    // distance to base ring
    if ((q.x > radius) && (projected > length(vec2(height, radius)))) {
      d = max(d, length(q - vec2(radius, 0.0)));
    }
    return d;
  }
