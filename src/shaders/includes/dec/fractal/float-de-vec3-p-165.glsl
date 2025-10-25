// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-165.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 k = vec3( 5.0, 2.0, 1.0 );
  p.y += 5.5;
  for( int j = 0; ++j < 8; ) {
    p.xz = abs( p.xz );
    p.xz = p.z > p.x ? p.zx : p.xz;
    p.z = 0.9 - abs( p.z - 0.9 );
    p.xy = p.y > p.x ? p.yx : p.xy;
    p.x -= 2.3;
    p.xy = p.y > p.x ? p.yx : p.xy;
    p.y += 0.1;
    p = k + ( p - k ) * 3.2;
  }
  return length( p ) / 6e3 - 0.001;
}

