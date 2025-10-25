// DEC SDF: // highly varied domain - take a look around
// Category: fractal | Author: unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/highly-varied-domain-take-a-look-around-4.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ){
    vec3 CSize = vec3(1., 1.7, 1.);
    p = p.xzy;
    float scale = 1.1;
    for( int i=0; i < 8;i++ ){
      p = 2.0*clamp(p, -CSize, CSize) - p;
      float r2 = dot(p,p+sin(p.z*.3));
      float k = max((2.)/(r2), .5);
      p *= k; scale *= k;
    }
    float l = length(p.xy);
    float rxy = l - 1.0;
    float n = l * p.z;
    rxy = max(rxy, (n) / 8.);
    return (rxy) / abs(scale);
  }
