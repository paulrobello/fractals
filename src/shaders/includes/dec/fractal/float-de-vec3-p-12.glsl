// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-12.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=1.;
    for(int i=0;i<3;i++){
      p=abs(p)-.3;
      if(p.x < p.y)p.xy=p.yx;
      if(p.x < p.z)p.xz=p.zx;
      if(p.y < p.z)p.yz=p.zy;
      p.xy-=.2; p*=2.; s*=2.;
    }
    p/=s;
    float h=.5;
    p.x-=clamp(p.x,-h,h);
    return length(vec2(length(p.xy)-.5,p.z))-.05;
  }
