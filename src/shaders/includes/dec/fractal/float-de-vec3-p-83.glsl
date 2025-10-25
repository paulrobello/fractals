// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yuruyurau
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-83.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define b(p)length(max(abs(mod(p,.8)-.4)-.05,0.))
    vec3 l;
    p=cos(p)-vec3(.3), p.yx*=mat2(cos(.8+vec4(0.0,3.0,5.0,0.0)));
    return min(min(b(p.xy),b(p.xz)),b(p.yz));
  }
