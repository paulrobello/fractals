// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-21.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s = 2.;
    float e = 0.;
    for(int j=0;++j<7;)
      p.xz=abs(p.xz)-2.3,
      p.z>p.x?p=p.zyx:p,
      p.z=1.5-abs(p.z-1.3+sin(p.z)*.2),
      p.y>p.x?p=p.yxz:p,
      p.x=3.-abs(p.x-5.+sin(p.x*3.)*.2),
      p.y>p.x?p=p.yxz:p,
      p.y=.9-abs(p.y-.4),
      e=12.*clamp(.3/min(dot(p,p),1.),.0,1.)+
      2.*clamp(.1/min(dot(p,p),1.),.0,1.),
      p=e*p-vec3(7.0,1.0,1.0),
      s*=e;
    return length(p)/s;
  }
