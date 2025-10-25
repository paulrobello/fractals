// DEC SDF: float de ( vec3 P ) {
// Category: fractal | Author: Kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-211.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
  float a, d = min( ( P.y - abs( fract( P.z ) - 0.5f ) ) * 0.7f, 1.5f - abs( P.x ) );
  for( a = 2.0f; a < 6e2f; a += a )
    Q = P * a,
    Q.xz *= rotate2D( a ),
    d += abs( dot( sin( Q ), Q - Q + 1.0f ) ) / a / 7.0f;
  return d;
}

