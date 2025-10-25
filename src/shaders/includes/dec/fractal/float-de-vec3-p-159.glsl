// DEC SDF: float de(vec3 p){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-159.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.xz=abs(.5-mod(p.xz,1.))+.01;
    float DEfactor=1.;
    escape = 0.;
    for (int i=0; i<14; i++) {
      p = abs(p)-vec3(0.,2.,0.);  
      float r2 = dot(p, p);
      float sc=2./clamp(r2,0.4,1.);
      p*=sc; 
      DEfactor*=sc;
      p = p - vec3(0.1,1.2,0.5);
      escape += exp(-0.2*dot(p,p));
    }
    return length(p)/DEfactor-.0005;
  }
