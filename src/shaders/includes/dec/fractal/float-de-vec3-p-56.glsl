// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-56.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,d=1.,s,h;
    vec3 e,q;
    s=2.;h=.3;
    for(int j=0;j++<8;){
      p=abs(p)-1.; q=p;
      for(int k=0;++k<3;)
        p-=clamp(dot(q,e=vec3(9>>k&1,k>>1&1,k&1)-.5),-h,h)*e*2.;
      p*=1.4;s*=1.4;
    }
    return length(p)/(4.*s);
  }
