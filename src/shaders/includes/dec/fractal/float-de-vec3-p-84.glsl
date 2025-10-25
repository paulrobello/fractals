// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-84.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define F1(a,n)a=abs(a)-n,a=vec2(a.x*.5+a.y,a.x-a.y*.5)
    p=fract(p)-.5;
    for(int j=0;j++<8;)
      F1(p.zy,.0),
      F1(p.xz,.55);
    return .4*length(p.yz)-2e-3;
  }
