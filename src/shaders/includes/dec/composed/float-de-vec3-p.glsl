// DEC SDF: float de(vec3 p){
// Category: composed | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-de-vec3-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    Q=p;
    Q.xy=vec2(atan(Q.x,Q.y)/.157,length(Q.xy)-3.);
    Q.zx=fract(Q.zx)-.5;
    return min(min(length(Q.xy),length(Q.yz))-.2,p.y+.5);
  }
