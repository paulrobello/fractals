// DEC SDF: float de( vec3 p ) {
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-17.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2.,r2;
    p=abs(p);
    for(int i=0; i<12;i++) {
      p=1.-abs(p-1.);
      r2=1.2/dot(p,p);
      p*=r2; s*=r2;
    }
    return length(cross(p,normalize(vec3(1.0))))/s-0.003;
  }
