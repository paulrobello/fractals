// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-122.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=1., e, offset=0.26; // vary between 0 and 1
    for(int i=0;i++<5;){
      s*=e=2./min(dot(p,p),1.);
      p=abs(p)*e-vec3(1.0,10.*offset,1.0);
    }
    return length(max(abs(p)-1.,0.))/s;
  }
