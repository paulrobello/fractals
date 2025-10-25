// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-4.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=3.;
    for(int i = 0; i < 4; i++) {
      p=mod(p-1.,2.)-1.;
      float r=1.2/dot(p,p);
      p*=r; s*=r;
    }
    p = abs(p)-0.8;
    if (p.x < p.z) p.xz = p.zx;
    if (p.y < p.z) p.yz = p.zy;
    if (p.x < p.y) p.xy = p.yx;
    return length(cross(p,normalize(vec3(0.0,1.0,1.0))))/s-.001;
  }
