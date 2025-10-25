// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-19.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=4.;
    p=abs(p);
    vec3 off=p*4.6;
    for (float i=0.; i<8.; i++){
      p=1.-abs(abs(p-2.)-1.);
      float r=-13.*clamp(.38*max(1.3/dot(p,p),.7),0.,3.3);
      s*=r; p*=r; p+=off;
    }
    return length(cross(p,normalize(vec3(1.0,3.0,3.0))))/s-.006;
  }
