// DEC SDF: float de(vec3 p){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-139.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s = 1.;
    float t = 999.;
    for(int i = 0; i < 12; i++){
      float k =  1.3/clamp(dot(p,p),0.1,1.);
      p *= k; s *= k;
      p=abs(p)-vec3(6.2,2.,1.7);
      p=mod(p-1.,2.)-1.;
      t = min(t, length(p)/s);
    }
    return t;
  }
