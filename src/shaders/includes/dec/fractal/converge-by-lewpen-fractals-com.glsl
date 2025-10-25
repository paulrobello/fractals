// DEC SDF: //  Converge by Lewpen (fractals.com)
// Category: fractal | Author: Lewpen
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/converge-by-lewpen-fractals-com.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( in vec3 pos ) {
  float fd = 1.0;
  vec3 cs = vec3( -0.1, 0.3, 0.4 );
  float fs = 1.0;
  vec3 fc = vec3( -0.2, -0.3, -1.1 ) ; 
  vec3 p = pos;
  float dEfactor = 2.0;
  for ( int i = 0; i < 38; i++ ) {
    p = 1.9 * clamp( p, -cs, cs ) - p;
    float k = max( 0.58 * fs / dot( p, p ), 1.0 );
    p *= k;
    dEfactor *= k;
    p += fc;
  }
  return ( abs( length( p.xyz ) - 1.0 ) * 1.0 ) / abs( dEfactor );
}
