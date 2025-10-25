// DEC SDF: float de ( vec3 p ){
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-175.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e = 1.;
  for( int i=0;i++<9; ){
    p = abs( p ) - .2;
    p = p.x > p.y ? p.zxy : p.zyx;
    p *= 2.0;
    e *= 2.0;
    p.xz *= rotate2D( 2.6 );
    p.yx = abs( p.yx ) - 4.0;
  }
  p /= e;
  return e = length( p ) * .8 - .01;
}

