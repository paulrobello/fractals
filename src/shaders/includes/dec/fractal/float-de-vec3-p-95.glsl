// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-95.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,d=1.,b=1.73;
    vec3 Q=mod(p,b*2.)-b;
    for(int j=0;j++<6;){
      Q=abs(Q);
      if(Q.y>Q.x)Q.xy=Q.yx;
      if(Q.z>Q.x)Q.zx=Q.xz;
      Q*=2.;
      Q.x-=b;
    }
    return (dot(abs(Q),vec3(1.0)/b)-1.)/64.;
  }
