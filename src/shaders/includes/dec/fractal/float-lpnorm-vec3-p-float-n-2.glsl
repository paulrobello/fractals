// DEC SDF: float lpNorm(vec3 p, float n){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-lpnorm-vec3-p-float-n-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p = pow(abs(p), vec3(n));
    return pow(p.x+p.y+p.z, 1.0/n);
  }

  float de(vec3 p){
    float s = 1.;
    for(int i = 0; i < 9; i++) {
      p=p-2.*round(p/2.);
      float r2=1.1/max(pow(lpNorm(p.xyz, 4.5),1.6),.15);
      p*=r2; s*=r2;
    }
    return length(p)/s-.001;
  }
