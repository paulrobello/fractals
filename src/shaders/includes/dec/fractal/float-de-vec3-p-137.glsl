// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-137.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2.;
    float e = 0;
    float l=dot(p,p);
    p=abs(abs(p)-.4)-.2;
    p.x<p.y?p=p.yxz:p;
    p.y<p.z?p=p.xzy:p;
    for(int i=0;i++<8;){
      s*=e=2./min(dot(p,p),1.3);
      p=abs(p)*e-vec2(l,16.).xxy;
    }
    return length(p)/s;
  }
