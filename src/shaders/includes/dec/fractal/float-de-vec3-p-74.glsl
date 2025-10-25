// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-74.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define F1(s)p.s=abs(p.s)-1.
    p+=vec3(0.0,3.8,5.);
    vec3 q=p;
    p=mod(p,vec3(8.0,8.0,2.0))-vec3(4.0,4.0,1.0);
    F1(yx); F1(yx); F1(xz);
    return min(length(cross(p,vec3(.5)))-.03,length(p.xy)-.05);
  }
