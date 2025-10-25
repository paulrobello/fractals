// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-67.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e=1.,R,S;
    vec3 q=p*8.; R=8.;
    for(int j=0;j++<6;)
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.),
      S=-5.*clamp(1.5/dot(p,p),.8,5.),
      p=p*S+q, R*=S;
    return length(p)/R;
  }
