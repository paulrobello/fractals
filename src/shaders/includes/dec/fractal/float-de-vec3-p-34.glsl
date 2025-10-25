// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-34.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e=1.,B=2.95,H=.9, s=2.;
    p.z=mod(p.z-2.,4.)-2.;
    for(int j=0;j++<8;)
    {
      p=abs(p);
      p.x < p.z?p=p.zyx:p;
      p.x=H-abs(p.x-H);
      p.y < p.z?p=p.xzy:p;
      p.xz+=.1;
      p.y < p.x?p=p.yxz:p;
      p.y-=.1;
    }
    p*=B; p-=2.5; s*=B;
    return length(p.xy)/s-.007;
  }
