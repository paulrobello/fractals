// DEC SDF: float lpNorm(vec3 p, float n){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-lpnorm-vec3-p-float-n-3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p = pow(abs(p),vec3(n));
    return pow(p.x+p.y+p.z,1./n);
  }
  float de( vec3 p ){
    float scale=4.5;
    float mr2=.5;
    float off=.5;
    float s=1.;
    vec3 p0 = p;
    for (int i=0; i<16; i++) {
      if(i%3==0)p=p.yzx;
      if(i%2==1)p=p.yxz;
      p -= clamp(p,-1.,1.)*2.;
      float r2=pow(lpNorm(p.xyz,5.),2.);
      float g=clamp(mr2*max(1./r2,1.),0.,1.);
      p=p*scale*g+p0*off;
      s=s*scale*g+off;
    }
    return length(p)/s-.01;
  }
