// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-50.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define V vec2(.7,-.7)
    #define G(p)dot(p,V)
    float i=0.,g=0.,e=1.;
    float t = 0.34; // change to see different behavior
    for(int j=0;j++<8;){
      p=abs(rotate3D(0.34,vec3(1.0,-3.0,5.0))*p*2.)-1.,
      p.xz-=(G(p.xz)-sqrt(G(p.xz)*G(p.xz)+.05))*V;
    }
    return length(p.xz)/3e2;
  }
