// DEC SDF: mat2 rot( float a ) { return mat2( cos( a ), sin( a ), -sin( a ), cos( a ) ); }
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rot-float-a-return-mat2-cos-a-sin-a-sin-a-cos-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ) {
    float e, i = 0.0, j, f, a, w;
    p.yz *= rot( 0.7 );
    f = 0.4;
    i < 45.0 ? p : p -= 0.001;
    e = p.y + 5.0;
    for( a = j = 0.9; j++ < 30.0; a *= 0.8 ) {
      vec2 m = vec2( 1. ) * rot( j );
      // float x = dot( p.xz, m ) * f + t + t; // time varying behavior
      float x = dot( p.xz, m ) * f + 0.0;
      w = exp( sin( x ) - 1.0 );
      p.xz -= m * w * cos( x ) * a;
      e -= w * a;
      f *= 1.2;
    }
    return e;
  }
