// DEC SDF: void rotT ( inout vec2 p, float a ) {
// Category: fractal | Author: mrange
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-rott-inout-vec2-p-float-a-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float c = cos( a );
  float s = sin( a );
  p = vec2( c * p.x + s * p.y, -s * p.x + c * p.y );
}
float box ( vec3 p, vec3 b ) {
  vec3 q = abs( p ) - b;
  return length( max( q, 0.0 ) ) + min( max( q.x, max( q.y, q.z ) ), 0.0 );
}
float mod1 ( inout float p, float size ) {
  float halfsize = size * 0.5;
  float c = floor( ( p + halfsize ) / size );
  p = mod( p + halfsize, size ) - halfsize;
  return c;
}
vec2 modMirror2 ( inout vec2 p, vec2 size ) {
  vec2 halfsize = size * 0.5;
  vec2 c = floor( ( p + halfsize ) / size );
  p = mod( p + halfsize, size ) - halfsize;
  p *= mod( c, vec2( 2.0 ) ) * 2.0 - vec2( 1.0 );
  return c;
}
float de ( vec3 p ) {
  vec3 op = p;
  float s = 1.3 + smoothstep( 0.15, 1.5, p.y ) * 0.95;
  float scale = 1.0;
  float r = 0.2;
  vec3 o = vec3( 0.22, 0.0, 0.0 );
  float d = 10000.0;
  const int rep = 7;
  for ( int i = 0; i < rep; i++ ) {
    mod1( p.y, 2.0 );
    modMirror2( p.xz, vec2( 2.0 ) );
    rotT( p.xz, PI / 5.5 );
    float r2 = dot( p, p ) + 0.0;
    float k = s / r2;
    float r = 0.5;
    p *= k;
    scale *= k;
  }
  d = box( p - 0.1, 1.0 * vec3( 1.0, 2.0, 1.0 ) ) - 0.5;
  d = abs( d ) - 0.01;
  float d1 = 0.25 * d / scale;
  float db = box( op - vec3( 0.0, 0.5, 0.0 ), vec3( 0.75, 1.0, 0.75 ) ) - 0.5;
  float dp = op.y;
  return min( dp, max( d1, db ) );
}

