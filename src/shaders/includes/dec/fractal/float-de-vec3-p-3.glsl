// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

// box fold
    p=abs(p)-15.;
    if(p.x < p.z)p.xz=p.zx;
    if(p.y < p.z)p.yz=p.zy;
    if(p.x < p.y)p.xy=p.yx;
    float s=2.;
    for (int i=0; i<8; i++){
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.);
      float r=-1.55/max(.41,dot(p,p));
      s*=r; p*=r; p-=.5;
    }
    s=abs(s);
    return dot(p,normalize(vec3(1.0,2.0,3.0)))/s;
  }
