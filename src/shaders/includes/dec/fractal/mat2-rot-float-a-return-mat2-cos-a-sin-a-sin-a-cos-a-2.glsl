// DEC SDF: mat2 rot ( float a ) { return mat2( cos( a ), -sin( a ), sin( a ), cos( a ) ); }
// Category: fractal | Author: Leon Denise
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rot-float-a-return-mat2-cos-a-sin-a-sin-a-cos-a-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de ( vec3 p ) {
    float scene = 100.;
    float t = 1000; // arbitrary value
    float falloff = 1.0;
    for ( float index = 0.; index < 8.; ++index ) {
      p.xz *= rot( t / falloff );
      p = abs( p ) - 0.5 * falloff;
      scene = min( scene, max( p.x, max( p.y, p.z ) ) );
      falloff /= 1.8;
    }
    return -scene;
  }
