// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-62.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s = 1.;
    for(int j=0;j<7;j++)
      p=mod(p-1.,2.)-1.,
      p*=1.2, s*=1.2,
      p=abs(abs(p)-1.)-1.;
    return (length(cross(p,normalize(vec3(2.0,2.03,1.0))))/s)-0.02;
  }
