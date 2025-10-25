// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-15.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=mod(p,2.)-1.;
    p=abs(p)-1.;
    if(p.x < p.z)p.xz=p.zx;
    if(p.y < p.z)p.yz=p.zy;
    if(p.x < p.y)p.xy=p.yx;
    float s=1.;
    for(int i=0;i<10;i++){
      float r2=2./clamp(dot(p,p),.1,1.);
      p=abs(p)*r2-vec3(.6,.6,3.5);
      s*=r2;
    }
    return length(p)/s;
  }
