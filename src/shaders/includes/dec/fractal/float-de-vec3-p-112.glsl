// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-112.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.xz=mod(p.xz,2.)-1.;
    vec3 q=p;
    float s=2., e;
    for(int j=0;j++<8;)
      s*=e=2./clamp(dot(p,p),.5,1.),
      p=abs(p)*e-vec3(.5,8.0,.5);
    return max(q.y,length(p.xz)/s);
  }
