// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-166.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float t = 0.0; // adjustment term
  float s = 12.0;
  float e = 0.0;
  for(int j = 0;j++ < 7; p /= e )
    p = mod( p - 1.0, 2.0 ) - 1.0,
    s /= e =dot( p, p );
  e -= abs( p.y ) + sin( atan( p.x, p.z ) * 6.0 + t * 3.0 ) * 0.2 - 0.3;
  return e / s;
}
