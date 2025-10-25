// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-49.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,R,S;vec3 q;
    q=p*2.;
    R=7.;
    for(int j=0;j++<9;){
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.);
      S=-9.*clamp(.7/min(dot(p,p),3.),0.,1.);
      p=p*S+q; R=R*abs(S);
    }
    return length(p)/R;
  }
