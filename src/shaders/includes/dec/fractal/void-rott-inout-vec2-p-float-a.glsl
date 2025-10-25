// DEC SDF: void rotT ( inout vec2 p, float a ) {
// Category: fractal | Author: mrange
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-rott-inout-vec2-p-float-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float c = cos( a );
  float s = sin( a );
  p = vec2( c * p.x + s * p.y, -s * p.x + c * p.y );
}
void r45 ( inout vec2 p) {
  p = ( p + vec2( p.y, -p.x ) ) * sqrt( 0.5 );
}
float de ( vec3 p ) {
  int layer = 0;
  const float s = 1.9;
  float scale = 1.0;
  float r = 0.2;
  vec3 o = vec3( 0.22, 0.0, 0.0 );
  float d = 0.0;
  for ( int i = 0; i < 11; ++i ) {
    p = ( -1.00 + 2.0 * fract( 0.5 * p + 0.5 ) );
    rotT(p.xz, -float(i)*PI/4.0);
    r45( p.xz );
    float r2 = dot( p, p ) + 0.0;
    float k = s / r2;
    float ss = pow( ( 1.0 + float( i ) ), -0.15 );
    p *= pow( k, ss );
    scale *= pow( k, -ss * ss );
    d = 0.25 * abs( p.y ) * scale;
    layer = i;
    if( abs( d ) < 0.00048 ) break;
  }
  return d;
}
