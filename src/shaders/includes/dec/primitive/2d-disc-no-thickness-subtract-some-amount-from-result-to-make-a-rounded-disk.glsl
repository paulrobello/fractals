// DEC SDF: 2D Disc - no thickness - subtract some amount from result to make a rounded disk
// Category: primitive | Author: Cupe / Mercury
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/2d-disc-no-thickness-subtract-some-amount-from-result-to-make-a-rounded-disk.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float r = 1.; // radius of the circle
    float l = length(p.xz) - r;

    return length(vec2(p.y, l));
  }
