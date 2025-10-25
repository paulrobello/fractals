// DEC SDF: Gyroid - Here constrained to a sphere of radius 4
// Category: primitive | Author: FabriceNeyret2
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/gyroid-here-constrained-to-a-sphere-of-radius-4.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p) {
    float scale = 7.;
    float thickness = 0.05;
    float bias = 0.1;

    p *= scale;
    return (abs(dot(sin(p*.5), cos(p.zxy * 1.23)) - bias) / scale - thickness)*0.55;
  }
