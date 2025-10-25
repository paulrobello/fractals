// DEC SDF: float de( vec3 p ) {
// Category: fractal | Author: nimitz/yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-161.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i, e, s, g, k = 0.01;
    p.xy *= mat2( cos( p.z ), sin( p.z ), -sin( p.z ), cos( p.z ) );
    e = 0.3 - dot( p.xy, p.xy );
    for( s = 2.0; s < 2e2; s /= 0.6 ) {
      p.yz *= mat2( cos( s ), sin( s ), -sin( s ), cos( s ) );
      e += abs( dot( sin( p * s * s * 0.2 ) / s, vec3( 1.0 ) ) );
    }
    return e;
  }
