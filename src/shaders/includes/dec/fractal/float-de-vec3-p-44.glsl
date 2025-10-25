// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-44.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=fract(p)-.5;
    vec3 O=vec3(2.,0.0,5.);
    for(int j=0;j++<7;){
      p=abs(p);
      p=(p.x < p.y?p.zxy:p.zyx)*3.-O;
      if(p.z < -.5*O.z)
      p.z+=O.z;
    }
    return length(p.xy)/3e3;
  }
