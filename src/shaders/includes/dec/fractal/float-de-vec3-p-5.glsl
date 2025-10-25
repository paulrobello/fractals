// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-5.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=3.; p=abs(p);
    for (float i=0.; i<9.; i++){
      p-=clamp(p,-1.,1.)*2.;
      float r=6.62*clamp(.12/min(dot(p,p),1.),0.,1.);
      s*=r; p*=r; p+=1.5;
    }
    s=abs(s); float a=.8;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
