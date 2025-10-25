// DEC SDF: mat2 rotate2D ( float r ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rotate2d-float-r-6.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2( cos( r ), sin( r ), -sin( r ), cos( r ) );
}

float de ( vec3 p ) {
  float e = 1.0, g;
  p = asin( sin( p ) );
  for( int i = 0; i++ < 7; ){
    p = abs( p ) - 0.1;
    p = p.x > p.y ? p.zxy : p.zyx;
    p *= 2.0;
    e *= 2.0;
    p.xz *= rotate2D( 2.8 );
    p.yx = abs( p.yx ) - 4.0;
  }
  p /= e;
  return e = abs( p.z ) * 0.6 - 0.02;
}

