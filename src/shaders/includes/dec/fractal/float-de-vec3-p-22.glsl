// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-22.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s = 4.;
    for(int i = 0; i < 8; i++) {
      p=mod(p-1.,2.)-1.;
      float r2=(i%3==0)?1.5:1.2/dot(p,p);
      p*=r2; s*=r2;
    }
    vec3 q=p/s;
    q.xz=mod(q.xz-.002,.004)-.002;
    return min(length(q.yx)-.0003,length(q.yz)-.0003);
  }
