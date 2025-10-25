// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-91.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,s,q;
    q=length(p)-1.;
    p.y++;
    s=3.;
    for(int i=0;i++<7;p=vec3(0.0,5.0,0.0)-abs(abs(p)*e-3.))
      s*=e=max(1.,14./dot(p,p));
    return max(q,min(1.,length(p.xz)-.3))/s;
  }
