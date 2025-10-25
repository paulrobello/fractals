// DEC SDF: float de ( vec3 p ){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-208.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float S = 1.0f;
  float R, e;
  p.y += p.z;
  p = vec3( log( R = length( p ) ) - time, asin( -p.z / R ), atan( p.x, p.y ) + time );
  for( e = p.y - 1.5f; S < 6e2; S += S )
    e += sqrt( abs( dot( sin( p.zxy * S ), cos( p * S ) ) ) ) / S;
  return e * R * 0.1f;
}
