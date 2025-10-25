// DEC SDF: // "Philosopher Stoned" by stb
// Category: fractal | Author: stb
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/philosopher-stoned-by-stb.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s, c;
#define rotate(p, a) mat2(c=cos(a), s=-sin(a), -s, c) * p
void rotateXY( inout vec3 p, vec2 axy ) {
  p.yz = rotate( p.yz, axy.y );
  p.xz = rotate( p.xz, axy.x );
}
vec3 fold ( in vec3 p, in vec3 n ) {
  n = normalize( n );
  p -= n * max( 0., 2. * dot( p, n ) );
  return p;
}
float de ( in vec3 p ) {
  float f;
  float t = time;
  const float I = 64.;
  for ( float i = 0.; i < I; i++ ) {
    rotateXY( p, vec2( 10. - .024273 * t, .0045 * t ) );
    //p = abs( p );
    p = fold( p, vec3(  1., -1., 0. ) );
    p = fold( p, vec3( -1., 0., -1. ) );
    p -= .125 * .025 / ( ( i + 1. ) / I );
  }
  f = length( p )-.007;
  return f;
}

