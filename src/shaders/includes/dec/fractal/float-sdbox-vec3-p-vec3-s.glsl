// DEC SDF: float sdBox(vec3 p, vec3 s) {
// Category: fractal | Author: Schwarz P
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-sdbox-vec3-p-vec3-s.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p = abs(p)-s;
  return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}
float de(vec3 p) {
    float t = time;
    float box = sdBox(p, vec3(1.0));
    float scale = 5.5;
    float surf = cos(p.x * scale) + cos(p.y * scale) + cos(p.z * scale) + 2. * sin(t);
    surf = abs(surf) - 0.01;
    surf *= 0.1;
    return max(box, surf);
}
