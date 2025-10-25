// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-113.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.xz=abs(p.xz)-1.;
    p.x>p.z?p=p.zyx:p;
    float s=2., e;
    for(int j=0;j++<7;)
      s*=e=2.2/clamp(dot(p,p),.3,1.2),
      p=abs(p)*e-vec3(1.0,8.0,.03);
    return length(p.yz)/s;
  }
