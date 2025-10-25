// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-168.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e, j, s, k;
  e = 0.0;
  float t = 0.0; // time adjust term 
  float n = 9.0;
  k = t / n;
  p = vec3( log( length( p ) ) ,( atan( p.z, p.x ) - k ) / PI, sin( p.y / n + k ) );
  for ( s = j = 1.0; j++ < n; p = 3.0 - abs( p * e ) )
    p.y -= round( p.y ),
    s *= e = 3.0 / min( dot( p, p ), 1.0 );
  return e = length( p ) / s;
}
