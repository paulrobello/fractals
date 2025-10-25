// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-75.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float l,s=3.;
    float t = 4.5;
    for(int j=0;j++<5;p.xy=fract(p.xy+p.x)-.5)
      p=vec3(log(l=length(p.xy)),atan(p.y,p.x)/PI*2.,p.z/l+1.),
      s*=.5*l;
    return abs(p.z)*s;
  }
