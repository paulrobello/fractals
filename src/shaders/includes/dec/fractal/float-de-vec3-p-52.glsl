// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-52.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,a,n,h,d=1.,t=0.3; // change t for different behavior
    vec3 q;
    n=.4;
    for(a=1.;a<2e2;n+=q.x*q.y*q.z/a)
      p.xy*=rotate2D(a+=a),
      q=cos(p*a+t);
    return n*.3;
  }
