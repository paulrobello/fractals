// DEC SDF: #define ei(a) mat2(cos(a),-sin(a),sin(a),cos(a))
// Category: fractal | Author: wyatt
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-ei-a-mat2-cos-a-sin-a-sin-a-cos-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float ln ( vec3 p, vec3 a, vec3 b ) {
    float l = clamp( dot( p - a, b - a ) / dot( b - a, b - a ), 0.0, 1.0 );
    return mix( 0.7, 1.0, l ) * length( p - a - ( b - a ) * l );
}
float de( vec3 u ) {
  u.xz *= ei( 0.9 );
  u.xy *= ei( 1.5 );
  float d = 1e9;
  vec4 c = vec4( 0.0 ); // orbit trap term
  float sg = 1e9;
  float l = 0.1;
  u.y = abs( u.y );
  u.y += 0.1;
  mat2 M1 = ei( 2.0 );
  mat2 M2 = ei( 0.4 );
  float w = 0.05;
  for ( float i = 0.0; i < 18.0; i++ ) {
    sg = ln( u, vec3( 0.0 ), vec3( 0.0, l, 0.0 ) ) / l;
    d = min( d, sg * l - w );
    w *= 0.66;
    u.y -= l;
    u.xz *= M1;
    u.xz = abs( u.xz );
    u.xy *= M2;
    l *= 0.75;
    c += exp( -sg * sg ) * ( 0.5 + 0.5 * sin( 3.1 * i / 16.0 + vec4( 1.0, 2.0, 3.0, 4.0 ) ) );
  }
  return d;
}

