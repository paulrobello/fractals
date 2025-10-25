// DEC SDF: float de( vec3 p ) {
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-163.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define L(p) p.y>p.x?p=p.yx:p
    vec3 k=vec3(5.0,2.0,1.0);
    p.y+=5.4;
    for(int j=0;++j<8;)
      p.xz=abs(p.xz),
      L(p.xz),
      p.z=1.-abs(p.z-.9),
      L(p.xy),
      p.x-=2.,
      L(p.xy),
      p.y+=1.,
      p=k+(p-k)*3.;
    return length(p)/1e4;
  }
