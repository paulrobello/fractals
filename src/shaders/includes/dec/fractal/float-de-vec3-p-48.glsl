// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-48.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e=1.,s=2.,l;
    vec3 a=vec3(.5);
    p.z-=55.; p=abs(p);
    for(int j=0;j++<8;)
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.),
      s*=l=-1.55/max(.4,dot(p,p)),
      p=p*l-.535;
    return dot(p,a)/s;
  }
