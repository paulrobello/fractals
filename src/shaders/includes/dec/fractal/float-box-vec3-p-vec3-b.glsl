// DEC SDF: float box ( vec3 p, vec3 b ) {
// Category: fractal | Author: zackpudil
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-box-vec3-p-vec3-b.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 d = abs( p ) - b;
  return min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) );
}
float de ( vec3 p ) {
  vec4 q = vec4( p, 1.0 );
  q.y = mod( q.y + 1.0, 2.0 ) - 1.0;
  q.xyz -= 1.0;
  for ( int i = 0; i < 3; i++ ) {
    q.xyz = abs( q.xyz + 1.0 ) - 1.0;
    q = 1.2 * q / clamp( dot( q.xyz, q.xyz ), 0.25, 1.0 );
  }
  float f = box( q.xyz, vec3( 1.0 ) ) / q.w;
  f = min( f, p.y + 2.0 );
  f = min( f, min( p.x + 3.0, -p.x + 3.0 ) );
  f = min( f, min( p.z + 3.0, -p.z + 3.0 ) );
  return f;
}

