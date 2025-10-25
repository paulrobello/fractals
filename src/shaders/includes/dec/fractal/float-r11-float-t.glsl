// DEC SDF: float r11 ( float t ) {
// Category: fractal | Author: Jeyko
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-r11-float-t.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return fract( sin( t * 414.125 ) * 114.12521 );
}
float valN ( float t ) {
  return mix( r11( floor( t ) ), r11( floor( t ) + 1.0 ), pow( fract( t ), 2.0 ) );
}
vec3 nois ( float t ) {
  t /= 2.0;
  return vec3( valN( t + 200.0 ), valN( t + 10.0 ), valN( t + 50.0 ) );
}
float sdBox ( vec3 p, vec3 s ) {
  p = abs( p ) - s;
  return max( p.x, max( p.y, p.z ) );
}
#define rot(j) mat2(cos(j),-sin(j),sin(j),cos(j))
float de ( vec3 p ) {
  vec3 n = nois( time );
  float d = 10e7;
  vec3 sz = vec3( 1.0, 0.5, 0.5 ) / 2.0;
  for( int i = 0; i < 8; i++ ){
    float b = sdBox( p, sz );
    sz *= vec3( 0.74, 0.5, 0.74 );
    d = min( b, d );
    p = abs( p );
    p.xy *= rot( -0.9 + n.x );
    p.yz *= rot( 0.6 - n.y * 0.3 );
    p.xz *= rot( -0.2 + n.y * 0.1 );
    p.xy -= sz.xy * 2.0;
  }
  return d;
}
