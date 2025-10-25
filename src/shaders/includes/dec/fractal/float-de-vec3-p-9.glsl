// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-9.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p=abs(p);
    float s=3.;
    vec3  offset = p*.5;
    for (float i=0.; i<5.; i++){
      p=1.-abs(p-1.);
      float r=-3.*clamp(.57*max(3./dot(p,p),.9),0.,1.);
      s*=r; p*=r; p+=offset;
    }
    s=abs(s);
    return length(cross(p,normalize(vec3(1.0))))/s-.008;
  }
