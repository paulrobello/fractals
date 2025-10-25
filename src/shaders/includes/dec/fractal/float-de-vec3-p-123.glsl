// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-123.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2.5, e;
    p=abs(mod(p-1.,2.)-1.)-1.;
    for(int j=0;j++<10;)
      p=1.-abs(p-1.),
      s*=e=-1.8/dot(p,p),
      p=p*e-.7;
    return abs(p.z)/s+.001;
  }
