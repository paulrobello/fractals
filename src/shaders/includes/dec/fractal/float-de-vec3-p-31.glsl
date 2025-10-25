// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-31.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define R(a)a=vec2(a.x+a.y,a.x-a.y)*.7
    #define G(a,n)R(a);a=abs(a)-n;R(a)
      p=fract(p)-.5;
      G(p.xz,.3);
      G(p.zy,.1);
      G(p.yz,.15);
      return .6*length(p.xy)-.01;
    #undef R
    #undef G
  }
