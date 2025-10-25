// DEC SDF: mat2 rot ( float a ) {
// Category: fractal | Author: rickiters
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rot-float-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2( cos( a ), sin( a ), -sin( a ), cos( a ) );  
}
vec2 Rotate ( vec2 v, float angle ) {
  return v * rot( angle );
}
vec2 Kaleido ( vec2 v, float power ) {
  float TAO = 2.0 * 3.14159;
  return Rotate( v, floor( 0.5 + atan( v.x, -v.y ) * power / tao ) * tao / power );
}
float sdCappedCone ( in vec3 p, in vec3 c ) {
  vec2 q = vec2( length( p.xy ), -p.z );
  float d1 = p.z - c.z;
  float d2 = max( dot( q, c.xy ), -p.z );
  return length( max( vec2( d1, d2 ), 0.0 ) ) + min( max( d1, d2 ), 0.0 );
}
float sceneCone ( vec3 p ) {
  p += vec3( 0.0, 0.0, 7.5 );
  return sdCappedCone( p,vec3( 264.0 / 265.0, 23.0 / 265.0, 7.5 ) );
}
float de ( vec3 p ) {
  vec3 c = vec3( 10.0 );
  float scl = 0.5;
  float sclpow = 1.0;
  float sc;
  float sym = 5.0;
  p.xz = Kaleido( p.xz, sym );
  float d = sceneCone( p );
  for ( int i = 0;i < 6 ; ++i ) {
    p += vec3( 0.0, 0.0, 5.0 );
    p *= 1.0 / scl;
    sclpow *= scl;
    p.xz = Kaleido( p.xz, sym );
    sc = sceneCone( p ) * sclpow;
    d = min( d, sc );
  }
  return d;
}

