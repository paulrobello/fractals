// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-118.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float n=1.+snoise3D(p), s=4., e;
    for(int i=0;i++<7;p.y-=20.*n)
      p.xz=.8-abs(p.xz),
      p.x < p.z?p=p.zyx:p,
      s*=e=2.1/min(dot(p,p),1.),
      p=abs(p)*e-n;
    return length(p)/s+1e-4;
  }
