// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-69.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,R=2.,S;
    for(int j=0;j++<9;)
      p=1.-abs(p-1.),
      p*=S=(j%3>1)?1.3:1.2/dot(p,p),
      R*=S;
    return length(cross(p,vec3(.5)))/R-5e-3;
  }
