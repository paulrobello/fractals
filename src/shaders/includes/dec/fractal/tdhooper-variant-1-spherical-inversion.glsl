// DEC SDF: // tdhooper variant 1 - spherical inversion
// Category: fractal | Author: Jos Leys / Knighty / tdhooper
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/tdhooper-variant-1-spherical-inversion.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec2 wrap ( vec2 x, vec2 a, vec2 s ) {
  x -= s;
  return (x - a * floor(x / a)) + s;
}

void TransA ( inout vec3 z, inout float DF, float a, float b ) {
  float iR = 1. / dot( z, z );
  z *= -iR;
  z.x = -b - z.x;
  z.y = a + z.y;
  DF *= iR; // max( 1.0, iR );
}

float de( vec3 z ) {
  vec3 InvCenter = vec3( 0.0, 1.0, 1.0 );
  float rad = 0.8;
  float KleinR = 1.5 + 0.39;
  float KleinI = ( 0.55 * 2.0 - 1.0 );
  vec2 box_size = vec2( -0.40445, 0.34 ) * 2.0;
  vec3 lz = z + vec3( 1.0 ), llz = z + vec3( -1.0 );
  float d = 0.0; float d2 = 0.0;
  z = z - InvCenter;
  d = length( z );
  d2 = d * d;
  z = ( rad * rad / d2 ) * z + InvCenter;
  float DE = 1e12;
  float DF = 1.0;
  float a = KleinR;
  float b = KleinI;
  float f = sign( b ) * 0.45;
  for ( int i = 0; i < 80; i++ ) {
    z.x += b / a * z.y;
    z.xz = wrap( z.xz, box_size * 2.0, -box_size );
    z.x -= b / a * z.y;
    if ( z.y >= a * 0.5 + f * ( 2.0 * a - 1.95 ) / 4.0 * sign( z.x + b * 0.5 ) * 
     ( 1.0 - exp( -( 7.2 - ( 1.95 - a ) * 15.0 )* abs(z.x + b * 0.5 ) ) ) ) {
      z = vec3( -b, a, 0.0 ) - z;
    } //If above the separation line, rotate by 180° about (-b/2, a/2)
    TransA( z, DF, a, b ); //Apply transformation a
    if ( dot( z - llz, z - llz ) < 1e-5 ) {
      break;
    } //If the iterated points enters a 2-cycle, bail out
    llz = lz; lz = z; //Store previous iterates
  }
  float y =  min(z.y, a - z.y);
  DE = min( DE, min( y, 0.3 ) / max( DF, 2.0 ) );
  DE = DE * d2 / ( rad + d * DE );
  return DE;
}
