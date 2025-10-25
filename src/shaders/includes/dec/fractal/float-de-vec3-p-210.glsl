// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: aiekick
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-210.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float d = 0.0f;
  float t = 0.3f;
  float s = 1.0f;
  vec4 r = vec4( 0.0f );
  vec4 q = vec4( p, 0.0f );
  for ( int j = 0; j < 4 ; j++ )
    r = max( r *= r *= r = mod( q * s + 1.0f, 2.0f ) - 1.0f, r.yzxw ),
    d = max( d, ( 0.27f - length( r ) * 0.3f ) / s ),
    s *= 3.1f;
  return d;
}

