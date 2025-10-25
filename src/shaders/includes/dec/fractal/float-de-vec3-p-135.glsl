// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-135.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float a=2.,s=3.,e,l=dot(p,p);
    p=abs(p)-1.;
    p.x < p.y?p=p.yxz:p;
    p.x < p.z?p=p.zyx:p;
    p.y < p.z?p=p.xzy:p;
    for(int i=0;i<8;i++){
      s*=e=2.1/clamp(dot(p,p),.1,1.);
      p=abs(p)*e-vec3(.3*l,1.0,5.*l);
    }
    p-=clamp(p,-a,a);
    return length(p)/s-0.;
  }
