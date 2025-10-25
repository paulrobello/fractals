// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-145.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q = fract(p)-.5;
    for(int j=0;j++<5;){
      Q=abs(Q)-.17;
      if(Q.y>Q.x)
        Q.xy=Q.yx;
      if(Q.z>Q.y)
        Q.yz=Q.zy;
      Q.z=abs(Q.z);
      Q-=.17;
      Q*=3.;
    }
    return max((length(Q)-.9)/3e2,1.37-length(p.xy));
  }
