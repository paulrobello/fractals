// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-58.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,s;
    vec3 q=p; s=5.;
    for(int j=0;j++<6;s*=e)
      p=sign(p)*(1.7-abs(p-1.7)),
      p=p*(e=8./clamp(dot(p,p),.3,5.))+q-vec3(.8,12.0,.8);
    return length(p.yz)/s;
  }
