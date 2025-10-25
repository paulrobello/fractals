// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-104.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=sin(2.8*p+5.*sin(p*.3));
    float s=2., e;
    for(int i=0;i++<6;)
      p=abs(p-1.7)-1.5,
      s*=e=2.3/clamp(dot(p,p),.3,1.2),
      p=abs(p)*e;
    return length(p.zy)/s;
  }
