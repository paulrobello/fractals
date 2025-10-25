// DEC SDF: float de(vec3 p){
// Category: fractal | Author: adapted from code by notargs
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-152.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float a=p.z*.1;
    p.xy *= mat2(cos(a),sin(a),-sin(a),cos(a));
    return abs(.1-length(cos(p.xy)+sin(p.yz)));
  }
