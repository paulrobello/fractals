// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: natchinoyuchi ( modified )
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-203.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p += vec3( 3.0, 3.0, -17.0 );
  float i, d = 3.0, e = 0.0, g, a = 3.0, t = time;
  p += a;
  for( int j = 0; j++ < 7; p *= e )
    p = abs( p - a ) - a,
    a = a * ( -sin( t ) * 0.6 + 0.61 ),
    d *= e = a * a * 2.0 / dot( p, p );
  return min( 0.3, ( p.y + length( p.xz ) ) / d );
}

