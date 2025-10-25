// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-111.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2., e;
    for(int j=0;j++<8;)
      s*=e=2./clamp(dot(p,p),.2,1.),
      p=abs(p)*e-vec3(.5,8.0,.5);
    return length(cross(p,vec3(1.0,1.0,-1.0)))/s;
  }
