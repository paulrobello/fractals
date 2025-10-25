// DEC SDF: #define rot(a)mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-5.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ) {
  float s = 4.0;
  for( int i = 0; i < 8; i++ ) {
    p.xz *= rot( 3.1415 / 3.0 );
    p = mod( 1.0 - p, 2.0 ) - 1.0;
    float r2 = ( 4.0 / 3.0 ) / dot( p, p );
    p *= r2;
    s *= r2;
  }
  return length( p ) * abs( p.y ) / s;
}
