// DEC SDF: float de(vec3 p){
// Category: fractal | Author: adapted from gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-47.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 a=vec3(.5, 0.1, 0.2);
    p.z-=55.;
    float s=2., l=0.;
    for(int j=0;j++<8;)
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.),
      s*=l=-2.12/max(.2,dot(p,p)),
      p=p*l-.55;
    return dot(p,a)/s;
  }
