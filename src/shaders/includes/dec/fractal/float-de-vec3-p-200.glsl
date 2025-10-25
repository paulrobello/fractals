// DEC SDF: float de(vec3 p){
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-200.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s = 1.;
  p.z += time;
  float c = length(mod(p, 1.)-.5)-.4;
  for(int i = 0; i < 10; i++) {
    p*=1.2;
    s*=1.2;
    c = max(c, -(length(mod(p, 1.)-.5)-.4)/s);
  }
  return c;
}

