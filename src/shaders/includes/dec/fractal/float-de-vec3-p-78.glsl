// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-78.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,R,S;
    vec3 q;
    p.z-=3.;
    q=p; R=1.;
    for(int j=0;j++<9;)
      p-=clamp(p,-.9,.9)*2.,
      S=9.*clamp(.1/min(dot(p,p),1.),0.,1.),
      p=p*S+q, R=R*S+1.;
    return .7*length(p)/R;
  }
