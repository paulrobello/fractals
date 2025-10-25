// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-23.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.z-=-1.;
    #define fold(p,v)p-2.*min(0.,dot(p,v))*v;
    float s=3., l=0.;
    for(int i = 0;++i<15;){
      p.xy=fold(p.xy,normalize(vec2(1.0,-1.3)));
      p.y=-abs(p.y);
      p.y+=.5;
      p.xz=abs(p.xz);
      p.yz=fold(p.yz,normalize(vec2(8.0,-1.0)));
      p.x-=.5;
      p.yz=fold(p.yz,normalize(vec2(1.0,-2.0)));
      p-=vec3(1.8,.4,.1);
      l = 2.6/dot(p,p);    p*=l;
      p+=vec3(1.8,.7,.2);  s*=l;
    }
    return length(p.xy)/s;
  }
