// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-55.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float h,d=1.,i,u,s, t = 0.8; // vary t for different behavior
    p+=vec3(1.0,1.0,sin(t/4.)*3.);
    s=2.;
    for(int j=0;j<9;j++){
      p.xy*=rotate2D(t/4.);
      u=4./3./dot(p,p);
      s*=u;
      p=mod(1.-p*u,2.)-1.;
    }
    return (length(p)/s);
  }
