// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: zackpudil
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-206.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec4 q = vec4( p, 1.0 );
  q.xz = mod(q.xz + 1.0, 2.0) - 1.0;
  for ( int i = 0; i < 15; i++ ) {
    q.xyz = abs( q.xyz );
    q /= clamp( dot( q.xyz, q.xyz ), 0.4, 1.0 );
    q = 1.7 * q - vec4( 0.5, 1.0, 0.4, 0.0 );
  }
  return min( length( q.xyz ) / q.w, min( p.y + 1.0, -p.y + 1.0 ) );
}

