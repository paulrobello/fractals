// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-202.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e = 1., g=0;
  for ( int i=0;i++<7;p=abs(p)-vec3(2.0,1.0,.2))
    p = 0.22-abs(abs(p)-.06),
    p = p.x>p.y?p.zxy:p.zyx,
    p *= 2.,
    e *= 2.,
    p.xz *= rotate2D(-.6);
    p /= e;
    g += e = length(p.xy);
  return e;
}
