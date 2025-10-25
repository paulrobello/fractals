// DEC SDF: float de(vec3 p){
// Category: fractal | Author: adapted from code by alia
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-86.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q=fract(p)-.5;
    float f=-length(p.xy)+2., g=length(q)-.6;
    return max(f,-g);
  }
