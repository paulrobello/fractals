// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-136.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.y+=1.4;
    //p.xz*=rotate2D(t*.5+.5);
    for(int j=0;++j<9;)
      p=abs(p),
      p.xy*=rotate2D(-9.78),
      p.x<p.y?p=p.yxz:p,
      p.x<p.z?p=p.zyx:p,
      p.y<p.z?p=p.xzy:p,
      p.yz*=rotate2D(-1.16),
      p=1.9*p-vec3(1.0,1.0,-1.0);
    return length(p-clamp(p,-5.,5.))/500.;
  }
