// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-160.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=cos(p);
    float s=2., e;
    for(int j=0;j++<7;)
      p=1.8-abs(p-1.2),
      p=p.x<p.y?p.zxy:p.zyx,
      s*=e=4.5/min(dot(p,p),1.5),
      p=p*e-vec3(.2,3.0,4.0);
    return length(p.xz)/s;
  }
