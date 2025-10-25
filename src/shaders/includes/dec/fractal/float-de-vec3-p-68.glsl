// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-68.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,g,e,s=2.,k;
    vec3 q;
    p=vec3(length(p.xy)-PI,atan(p.y,p.x)*PI,p.z);
    p.yz=mod(p.yz,4.)-2.;
    p=abs(p); q=p;
    for(int j=0;++j<5;)
      p=1.-abs(p-1.),
      p=-p*(k=max(3./dot(p,p),3.))+q, s*=k;
    return length(p.xz)/s;
  }
