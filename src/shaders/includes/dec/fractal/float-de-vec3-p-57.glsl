// DEC SDF: float  de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-57.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e=1.,s,l;
    p.z-=9.; s=2.;
    p=abs(p);
    for(int j=0;j++<6;)
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.),
      p*=l=-2./max(.3,sqrt(min(min(p.x,p.y),p.z))),
      p-=2., s*=l;
    return length(p)/s;
  }
