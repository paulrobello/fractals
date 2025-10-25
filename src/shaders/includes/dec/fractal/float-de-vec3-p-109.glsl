// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-109.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=1.-abs(abs(p+sin(p))-1.);
    p=p.x < p.y?p.zxy:p.zyx;
    float s=5., l;
    for(int j=0;j++<4;)
      s*=l=2./min(dot(p,p),1.5),
      p=abs(p)*l-vec3(2.0,1.0,3.0);
    return length(p.yz)/s;
  }
