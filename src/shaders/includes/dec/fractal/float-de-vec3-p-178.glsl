// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: snolot
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-178.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float adjust = 62.0; // time based adjustment
  p = mod( p, 2.0 ) - 1.0;
  p = abs( p ) - 1.0;
  if ( p.x < p.z ) p.xz = p.zx;
  if ( p.y < p.z ) p.yz = p.zy;
  if ( p.x < p.y ) p.xy = p.yx;
  if ( p.x > p.y ) p.xy =- p.yx;
  float s = 1.0;
  for( int i = 0;i < 10;i++ ) {
    p.y -= abs( sin( adjust * 0.1 ) );
    float r2 = 2.0 / clamp( dot( p, p ), 0.2, 1.0 );
    p = abs( p ) * r2 - vec3( 0.45, 0.2, clamp( abs( sin( adjust * 0.7 ) * 4.2 ), 3.0, 5.2 ) );
    s *= r2;
  }
  return length( p ) / s;
}

