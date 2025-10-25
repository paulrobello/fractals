// DEC SDF: float box ( vec3 p, vec3 b ) {
// Category: composed | Author: zackpudil
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-box-vec3-p-vec3-b.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q = abs( p ) - b;
  return max( q.x, max( q.y, q.z ) );
}

vec2 un ( vec2 a, vec2 b ) {
  return a.x < b.x ? a : b;
}

vec2 shape ( vec3 p ) {
  vec2 s = vec2( box( p.xyz + vec3( 0.6, 0.0, 0.0 ), vec3( 0.6 ) ), 1.0 );
  vec2 t = vec2( box( p.xyz - vec3( 0.6, 0.0, 0.0 ), vec3( 0.6 ) ), 1.0 );
  return un( s, t );
}

float de ( vec3 p ) {
  vec4 q = vec4( p, 1.0 );
  for ( int i = 0; i < 7; i++ ) {
    q.xyz = -1.0 + 2.0 * fract( 0.5 + 0.5 * q.xyz );
    q = 1.01 * q / max( dot( q.xyz, q.xyz ), 0.95 );
  }
  vec2 s = shape( q.xyz ) / vec2( q.w, 1.0 );
  vec2 t = vec2( p.y - 0.3, 2.0 );
  p.xz = abs( p.xz ) - vec2( 0.2, 0.4 );
  p.xz = mod( p.xz + 1.0, 2.0 ) - 1.0;
  vec2 u = vec2( length( p.xz ) - 0.2, 3.0 );
  return un( un( s, t), u ).x;
}
