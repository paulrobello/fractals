// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=abs(p)-1.2;
    if(p.x < p.z)p.xz=p.zx;
    if(p.y < p.z)p.yz=p.zy;
    if(p.x < p.y)p.xy=p.yx;
    float s=1.;
    for(int i=0;i<6;i++){
      p=abs(p);
      float r=2./clamp(dot(p,p),.1,1.);
      s*=r; p*=r; p-=vec3(.6,.6,3.5);
    }
    float a=1.5;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
