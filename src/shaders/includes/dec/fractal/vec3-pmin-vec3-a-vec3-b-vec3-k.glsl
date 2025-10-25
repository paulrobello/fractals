// DEC SDF: vec3 pmin ( vec3 a, vec3 b, vec3 k ) {
// Category: fractal | Author: mrange
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-pmin-vec3-a-vec3-b-vec3-k.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 h = clamp( 0.5 + 0.5 * ( b - a ) / k, 0.0, 1.0 );
  return mix( b, a, h ) - k * h * ( 1.0 - h );
}
void sphere_fold ( inout vec3 z, inout float dz ) {
  const float fixed_radius2 = 1.9;
  const float min_radius2 = 0.5;
  float r2 = dot( z, z );
  if ( r2 < min_radius2 ) {
    float temp = ( fixed_radius2 / min_radius2 );
    z *= temp;
    dz *= temp;
  } else if ( r2 < fixed_radius2 ) {
    float temp = ( fixed_radius2 / r2 );
    z *= temp;
    dz *= temp;
  }
}
void box_fold(float k, inout vec3 z, inout float dz) {
  vec3 zz = sign( z ) * pmin( abs( z ), vec3( 1.0 ), vec3( k ) );
  z = zz * 2.0 - z;
}
float sphere ( vec3 p, float t ) {
  return length( p ) - t;
}
float boxf ( vec3 p, vec3 b, float e ) {
  p = abs( p ) - b;
  vec3 q = abs( p + e ) - e;
  return min( min(
    length( max( vec3( p.x, q.y, q.z ), 0.0 ) ) + min( max( p.x, max( q.y, q.z ) ), 0.0 ),
    length( max( vec3( q.x, p.y, q.z ), 0.0 ) ) + min( max( q.x, max( p.y, q.z ) ), 0.0 ) ),
    length( max( vec3( q.x, q.y, p.z ), 0.0 ) ) + min( max( q.x, max( q.y, p.z ) ), 0.0 ) );
}
float de ( vec3 z ) {
  const float scale = -2.8;
  vec3 offset = z;
  float dr = 1.0;
  float fd = 0.0;
  const float k = 0.05;
  for ( int n = 0; n < 5; ++n ) {
    box_fold( k / dr, z, dr );
    sphere_fold( z, dr );
    z = scale * z + offset;
    dr = dr * abs( scale ) + 1.0;
    float r1 = sphere( z, 5.0 );
    float r2 = boxf( z, vec3( 5.0 ), 0.5 );
    float r = n < 4 ? r2 : r1;
    float dd = r / abs( dr );
    if ( n < 3 || dd < fd ) {
      fd = dd;
    }
  }
  return fd;
}

