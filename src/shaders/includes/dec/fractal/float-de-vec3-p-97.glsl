// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-97.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.yz*=rotate2D(-.3);
    float ss=3., s=1.;
    for(int j=0; j++<7;){
      p=abs(p); p.y-=.5;
      s = 1./clamp(dot(p,p),.0,1.);
      p*=s; ss*=s;
      p-=vec2(1.0,.1).xxy;
      p.xyz=p.zxy;
    }
    return length(p.xy)/ss-.01;
  }
