// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-26.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.xz=fract(p.xz)-.5;
    float k=1.;
    float s=0.;
    for(int i=0;i++<9;)
      s=2./clamp(dot(p,p),.1,1.),
      p=abs(p)*s-vec3(.5,3.0,.5),
      k*=s;
    return length(p)/k-.001;
  }
