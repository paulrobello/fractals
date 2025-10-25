// DEC SDF: #define D(p) abs(dot(sin(p), cos(p.yzx)))
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-d-p-abs-dot-sin-p-cos-p-yzx.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float map(vec3 p) {
    float d = length(p) - .8;
    p *= 10.;
    d = max(d, (D(p) - .03) / 10.);
    p *= 10.;
    d = max(d, (D(p) - .3) / 100.);
    return d;
  }
