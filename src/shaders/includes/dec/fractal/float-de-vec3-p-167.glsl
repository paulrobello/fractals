// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-167.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p -= round( p );
  float s = 3.0;
  float e = 0.0;
  for( int i=0;i++ < 8; p = p / e + 2.0 )
    p = abs( p ) - 1.5,
    s /= e = min( dot( p, p ), 0.4 );
  return e = length( p.yz ) / s;
}

