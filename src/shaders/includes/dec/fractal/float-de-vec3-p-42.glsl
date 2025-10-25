// DEC SDF: float de(vec3 p){
// Category: fractal | Author: eiffie
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-42.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

const int iters=5;
    const int iter2=3;
    const float scale=3.48;
    const vec3 offset=vec3(1.9,0.0,2.56);
    const float psni=pow(scale,-float(iters));
    const float psni2=pow(scale,-float(iter2));
    p = abs(mod(p+3., 12.)-6.)-3.;
    vec3 p2;
    for (int n = 0; n < iters; n++) {
      if(n==iter2)p2=p;
      p = abs(p);
      if (p.x < p.y)p.xy = p.yx;
      p.xz = p.zx;
      p = p*scale - offset*(scale-1.0);
      if(p.z<-0.5*offset.z*(scale-1.0))
      p.z+=offset.z*(scale-1.0);
    }
    float d1=(length(p.xy)-1.0)*psni;
    float d2=length(max(abs(p2)-vec3(0.2,5.1,1.3),0.0))*psni2;
    escape=(d1 < d2)?0.:1.;
    return min(d1,d2);
  }
