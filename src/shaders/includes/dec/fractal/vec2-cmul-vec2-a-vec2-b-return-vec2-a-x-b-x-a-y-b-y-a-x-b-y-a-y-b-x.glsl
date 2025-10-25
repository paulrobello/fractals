// DEC SDF: vec2 cmul( vec2 a, vec2 b ) { return vec2( a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x ); }
// Category: fractal | Author: guil
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec2-cmul-vec2-a-vec2-b-return-vec2-a-x-b-x-a-y-b-y-a-x-b-y-a-y-b-x.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec2 csqr( vec2 a ) { return vec2( a.x * a.x - a.y * a.y, 2.0 * a.x * a.y ); }
vec2 conj( vec2 z ) { return vec2( z.x, -z.y ); }
vec4 dmul( vec4 a, vec4 b ) {
  float r = length( a );
  b.xy = cmul( normalize( a.xy ), b.xy );
  b.xz = cmul( normalize( a.xz ), b.xz );
  b.zw = cmul( normalize( a.zw ), b.zw );
  return r * b;
}

// Green Dragon
float de ( vec3 p) {
  float dr = 1.0;
  p *= dr;
  float r2;
  vec4 z = vec4( -p.yzx, 0.2 );
  dr = dr / length( z );
  if ( z.z > -0.5 )
    z.x += 0.5 * cos( time ) * abs( z.y ) * ( z.z + 0.5 );
  dr = dr * length( z );
  vec4 c = z;
  for ( int i = 0; i < 16; i++ ) {
    r2 = dot( z, z );
    if( r2 > 100.0 )
      continue;
    dr = 2.0 * sqrt( r2 ) * dr + 1.0;
    z = dmul( z, z ) + c;
  }
  return 0.5 * length( z ) * log( length( z ) ) / dr;
}

