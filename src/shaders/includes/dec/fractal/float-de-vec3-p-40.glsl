// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-40.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=4.;
    float l=0;
    p.z-=.9;
    vec3 q=p;
    s=2.;
    for(int j=0;j++<9;)
      p-=clamp(p,-1.,1.)*2.,
      p=p*(l=8.8*clamp(.72/min(dot(p,p),2.),0.,1.))+q,
      s*=l;
    return length(p)/s;
  }
