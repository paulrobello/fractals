// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-172.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e, s, t=0.0; // time adjust term
  vec3 q=p;
  p.z+=7.;
  p=vec3(log(s=length(p)),atan(p.y,p.x),sin(t/4.+p.z/s));
  s=1.;
  for(int j=0;j++<6;)
    s*=e=PI/min(dot(p,p),.8),
    p=abs(p)*e-3.,
    p.y-=round(p.y);
  return e=length(p)/s;
}
