// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-39.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float j = 0.5;
    for(p.xz=mod(p.xz,6.)-3.;++j<9.;p=3.*p-.9)
      p.xz=abs(p.xz),
      p.z>p.x?p=p.zyx:p,
      p.y>p.z?p=p.xzy:p,
      p.z--,
      p.x-=++p.y*.5;
    return min(.2,p.x/4e3-.2);
  }
