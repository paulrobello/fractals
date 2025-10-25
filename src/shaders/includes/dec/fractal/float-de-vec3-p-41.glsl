// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-41.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=3., l=0.;
    vec3 q=p;
    p=mod(p,4.)-2.;
    p=abs(p);
    for(int j=0;j++<8;)
      p=1.-abs(p-1.),
      p=p*(l=-1.*max(1./dot(p,p),1.))+.5,
      s*=l;
    return max(.2-length(q.xy),length(p)/s);
  }
