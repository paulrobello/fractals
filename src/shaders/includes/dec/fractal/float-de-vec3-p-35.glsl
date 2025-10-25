// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-35.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define hash(n) fract(sin(n*234.567+123.34))
    float seed=dot(floor((p+3.5)/7.)+3.,vec3(123.12,234.56,678.22));
    p-=clamp(p,-3.5,3.5)*2.;
    float scale=-5.;
    float mr2=.38;
    float off=1.2;
    float s=3.;
    p=abs(p);
    vec3  p0 = p;
    for (float i=0.; i<4.+hash(seed)*6.; i++){
      p=1.-abs(p-1.);
      float g=clamp(mr2*max(1.2/dot(p,p),1.),0.,1.);
      p=p*scale*g+p0*off;
      s=s*abs(scale)*g+off;
    }
    return length(cross(p,normalize(vec3(1.0))))/s-.005;
  }
