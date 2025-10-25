// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-190.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float t = 1.0; // time based adjustment
  p.xz+=vec2(cos(p.z*5.+t*2.),sin(p.x*8.));
  p.xz*=rotate2D(.5-atan(p.x,p.z));
  return .1*(p.z-p.y*p.y-.3);
}
