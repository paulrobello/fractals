// DEC SDF: // Spherical Inversion Variant of Above
// Category: fractal | Author: Jos Leys / Knighty
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/spherical-inversion-variant-of-above.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec2 wrap( vec2 x, vec2 a, vec2 s ){
  x -= s; 
  return ( x - a * floor( x / a ) ) + s;
}

void TransA( inout vec3 z, inout float DF, float a, float b ) {
  float iR = 1.0 / dot( z, z );
  z *= -iR;
  z.x = -b - z.x; z.y = a + z.y; 
  DF *= max( 1.0, iR );
}

float de ( vec3 p ) {
  float adjust = 6.28; // use this for time varying behavior
  float box_size_x = 1.0;
  float box_size_z = 1.0;
  float KleinR = 1.94 + 0.05 * abs( sin( -adjust * 0.5 ) ); //1.95859103011179;
  float KleinI = 0.03 * cos( -adjust*0.5 ); //0.0112785606117658;
  vec3 lz = p + vec3( 1.0 ), llz = p + vec3( -1.0 );
  float d = 0.0; float d2 = 0.0;
  vec3 InvCenter = vec3( 1.0, 1.0, 0.0 );
  float rad = 0.8;
  p = p - InvCenter;
  d = length( p );
  d2 = d * d;
  p = ( rad * rad / d2 ) * p + InvCenter;
  float DE = 1e10;
  float DF = 1.0;
  float a = KleinR;
  float b = KleinI;
  float f = sign( b ) * 1.0;
  for ( int i = 0; i < 20 ; i++ ) {
    p.x = p.x + b / a * p.y;
    p.xz = wrap( p.xz, vec2( 2. * box_size_x, 2. * box_size_z ), vec2( -box_size_x, - box_size_z ) );
    p.x = p.x - b / a * p.y;
    if ( p.y >= a * 0.5 + f *( 2.0 * a - 1.95 ) / 4.0 * sign( p.x + b * 0.5 ) * 
     ( 1.0 - exp( -( 7.2 - ( 1.95 - a ) * 15.0 )* abs( p.x + b * 0.5 ) ) ) ) { 
      p = vec3( -b, a, 0.0 ) - p;
    } //If above the separation line, rotate by 180° about (-b/2, a/2)
    TransA( p, DF, a, b ); //Apply transformation a
    if ( dot( p - llz, p - llz ) < 1e-5 ) { 
      break; 
    } //If the iterated points enters a 2-cycle , bail out.
    llz = lz; lz = p; //Store previous iterates
  }

  float y =  min( p.y, a-p.y );
  DE = min( DE, min( y, 0.3 ) / max( DF, 2.0 ) );
  DE = DE * d2 / ( rad + d * DE );
  return DE;
}
