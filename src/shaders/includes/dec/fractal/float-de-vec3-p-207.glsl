// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-207.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i = 0.0f;
  float u = 0.0f;
  float S = 6.0f;
  p--;
  for ( int j = 0; j++ < 8; p = abs( ++p ) - 1.0f )
    p.z =- p.z,
    u = dot( p, p ) * 0.6f,
    S /= u + 0.001f, // prevent divide-by-zero
    p /= u + 0.001f;
  return ( length( p.xz ) + p.y ) / S;
}

