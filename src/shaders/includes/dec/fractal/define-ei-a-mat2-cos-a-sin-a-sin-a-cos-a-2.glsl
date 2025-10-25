// DEC SDF: #define ei(a) mat2(cos(a),-sin(a),sin(a),cos(a))
// Category: fractal | Author: wyatt
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-ei-a-mat2-cos-a-sin-a-sin-a-cos-a-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float ln (vec3 p, vec3 a, vec3 b) {
  float l = clamp( dot( p - a, b - a ) / dot( b - a, b - a ), 0.0, 1.0 );
  return mix( 0.75, 1.0, l ) * length( p - a - ( b - a ) * l );
}
float de ( vec3 u ) {
  float adjust = 0.0; // branching parameter
  u.xz *= ei( 1.1 + adjust );
  u.xy *= ei( 1.1 );
  float d = 1e9;
  vec4 c = vec4( 0.0 ); // orbit trap term
  float sg = 1e9;
  float l = 0.08;
  u.y = abs( u.y );
  u.y += 0.1;
  mat2 M1 = ei( 1.0 );
  float w = 0.02;
  mat2 M2 = ei( 0.6 );
  mat2 M3 = ei( 0.4 + 0.2 * sin( adjust ) );
  for ( float i = 1.0; i < 20.0; i++ ) {
    sg = ln( u, vec3( 0.0 ), vec3( 0.0, l, 0.0 ) ) / l;
    d = min( d, sg * l - w );
    w *= 0.7;
    u.y -= l;
    u.xz *= M1;
    u.xz = abs( u.xz );
    u.zy *= M3;
    l *= 0.75;
    c += exp( -sg * sg ) * ( 0.7 + 0.5 * sin( 2.0 + 3.0 * i / 16.0 + vec4( 1.0, 2.0, 3.0, 4.0 ) ) );
  }
  return d;
}

