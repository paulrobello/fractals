// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-77.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,R=1.,S;
    vec3 q=p;
    for(int j=0;j++<9;)
      p-=clamp(p,-1.,1.)*2.,
      S=6.*clamp(.2/min(dot(p,p),7.),0.,1.),
      p=p*S+q*.7,  R=R*abs(S)+.7;
    return length(p)/R;
  }
