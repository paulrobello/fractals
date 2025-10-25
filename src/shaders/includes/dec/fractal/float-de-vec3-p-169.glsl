// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-169.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e, s=3.;
  p=.7-abs(p);
  p.x<p.y?p=p.yxz:p;
  for(int i=0;i++<8;)
    p=abs(p)-.9,
    e=dot(p,p),
    s*=e=2./min(e,2.)+6./min(e,.9),
    p=abs(p)*e-vec3(2.0,7.0,3.0);
  return e=length(p.yz)/s;
}

