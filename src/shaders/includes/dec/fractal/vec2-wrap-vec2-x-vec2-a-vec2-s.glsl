// DEC SDF: vec2 wrap ( vec2 x, vec2 a, vec2 s ) {
// Category: fractal | Author: Jos Leys / Knighty
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec2-wrap-vec2-x-vec2-a-vec2-s.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

x -= s;
  return ( x - a * floor( x / a ) ) + s;
}

void TransA( inout vec3 z, inout float DF, float a, float b ) {
  float iR = 1. / dot(z,z);
  z *= -iR;
  z.x = -b - z.x; 
  z.y =  a + z.y; 
  DF *= max( 1.0, iR );
}

float de ( vec3 z ) {
  float adjust = 6.2; // use this for time varying behavior
  float box_size_x = 1.0;
  float box_size_z = 1.0;
  float KleinR = 1.94 + 0.05 * abs( sin( -adjust * 0.5 ) ); //1.95859103011179;
  float KleinI = 0.03 * cos( -adjust * 0.5 ); //0.0112785606117658;
  vec3 lz = z +  vec3( 1.0 ), llz = z + vec3( -1.0 );
  float d = 0.0; float d2 = 0.0;
  float DE = 1e10;
  float DF = 1.0;
  float a = KleinR;
  float b = KleinI;
  float f = sign( b ) * 1.0;
  for ( int i = 0; i < 20 ; i++ ){
    z.x = z.x + b / a * z.y;
    z.xz = wrap( z.xz, vec2( 2.0 * box_size_x, 2.0 * box_size_z ), vec2( -box_size_x, -box_size_z ) );
    z.x = z.x - b / a * z.y;
    if ( z.y >= a * 0.5 + f * ( 2.0 * a - 1.95 ) / 4.0 * sign( z.x + b * 0.5 ) * 
     ( 1.0 - exp( -( 7.2 - ( 1.95 - a ) * 15.0 ) * abs( z.x + b * 0.5 ) ) ) ) { 
      z = vec3( -b, a, 0.0 ) - z;
    } //If above the separation line, rotate by 180° about (-b/2, a/2)

    TransA( z, DF, a, b ); //Apply transformation a
    if ( dot( z - llz, z - llz ) < 1e-5 ) { break; } //If the iterated points enters a 2-cycle , bail out.
    llz=lz; lz=z;  //Store previous iterates
  }
  
  float y =  min( z.y, a - z.y );
  DE = min( DE, min( y, 0.3 ) / max( DF, 2.0 ) );
  return DE;
}
