// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-212.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q = vec3(-.1,.65,-.6);
  float j,i,e,v,u;
  for(j=e=v=7.;j++<21.;e=min(e,max(length(p.xz=abs(p.xz*rotate2D(j+sin(1./u)/v))-.53)-.02/u,p.y=1.8-p.y)/v))
    v/=u=dot(p,p),p/=u+.01;
  return e;
}
