// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: Kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-209.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q, U = vec3( 1.0f );
  float d=1.0, a=1.0f;
  d = min( length( fract( p.xz) -0.5f ) - 0.2f, 0.3f - abs( p.y - 0.2f ) );
  for( int j = 0; j++ < 9; a += a )
    Q = p * a * 9.0f,
    Q.yz *= rotate2D( a ),
    d += abs( dot( sin( Q ), U ) ) / a * 0.02f;
  return d * 0.6f;
}
