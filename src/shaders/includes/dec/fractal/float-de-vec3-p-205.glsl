// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: zackpudil
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-205.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.xy = mod( p.xy + 1.0, 2.0 ) - 1.0;
  p.z = abs( p.z ) - 0.75;
  vec4 q = vec4( p, 1.0 );
  for ( int i = 0; i < 15; i++ ) {
    q.xyz = abs( q.xyz ) - vec3( 0.3, 1.0, -0.0 );
    q = 2.0 * q / clamp( dot( q.xyz, q.xyz ), 0.5, 1.0 ) - vec4( 1.0, 0.0, 0.3, 0.0 );
  }
  return abs(q.x + q.y + q.z)/q.w;
}

