// DEC SDF: float lpNorm( vec3 p, float n ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-lpnorm-vec3-p-float-n.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p = pow(abs(p), vec3(n));
    return pow(p.x+p.y+p.z, 1.0/n);
  }

  float de( vec3 p ){
    vec3 offset=p*.5;
    float s=2.;
    for (int i=0; i<5; i++){
      p=clamp(p,-1.,1.)*2.-p;
      float r=-10.*clamp(max(.3/pow(
      lpNorm(p,5.),2.),.3),.0,.6);
      s*=r; p*=r; p+=offset;
    }
    s=abs(s); float a=10.;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
