// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-170.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float y=p.y+=.2;
  p.z-=round(p.z);
  float e, s=3.;
  p=.7-abs(p);
  for(int i=0;i++<8;p.z+=5.)
    p=abs(p.x>p.y?p:p.yxz)-.8,
    s*=e=5./min(dot(p,p),.5),
    p=abs(p)*e-6.;
  return e=min(y,length(p.yz)/s);
}
