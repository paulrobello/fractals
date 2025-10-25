// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-171.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e, r, s=3., t = 0.0;
  p=vec3(log(r=length(p)),asin(p.z/r),atan(p.y,p.x)/PI*s)-t/PI;
  p-=round(p);
  for(int j=0;j++<7;p.z-=2.)
    s/=e=min(.3,dot(p,p))+.2,
    p=abs(p)/e-.2;
  return e=(length(p.xy)-.1)*r/s;
}

