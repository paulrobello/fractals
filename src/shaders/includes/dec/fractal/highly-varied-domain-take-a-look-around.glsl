// DEC SDF: // highly varied domain - take a look around
// Category: fractal | Author: unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/highly-varied-domain-take-a-look-around.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ){
    p = p.xzy;
    vec3 cSize = vec3(1., 1., 1.3);
    float scale = 1.;
    for( int i=0; i < 12; i++ ){
      p = 2.0*clamp(p, -cSize, cSize) - p;
      float r2 = dot(p,p);
      float k = max((2.)/(r2), .027);
      p *= k; scale *= k;
    }
    float l = length(p.xy);
    float rxy = l - 4.0;
    float n = l * p.z;
    rxy = max(rxy, -(n) / 4.);
    return (rxy) / abs(scale);
  }
