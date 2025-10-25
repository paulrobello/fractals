// DEC SDF: float de(vec3 p){ // has aliasing issues
// Category: fractal | Author: adapted from code by wrighter
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-has-aliasing-issues.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 a = sin(p/dot(p,p)*4);
    return 0.95*min(length(a.yx),length(a.yz))-0.52+0.2;
  }
