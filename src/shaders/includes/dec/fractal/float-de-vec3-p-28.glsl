// DEC SDF: float de(vec3 p){
// Category: fractal | Author: xem
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-28.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec4 o=vec4(p,1.0);
    vec4 q=o;
    for(float i=0.;i<9.;i++){
      o.xyz=clamp(o.xyz,-1.,1.)*2.-o.xyz;
      o=o*clamp(max(.25/dot(o.xyz,o.xyz),.25),0.,1.)*vec4(11.2)+q;
    }
    return (length(o.xyz)-1.)/o.w-5e-4;
  }
