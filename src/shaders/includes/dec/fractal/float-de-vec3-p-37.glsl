// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-37.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.z-=16.; float s=3.; float e=0.;
    p.y=abs(p.y)-1.8;
    p=clamp(p,-3.,3.)*2.-p;
    s*=e=6./clamp(dot(p,p),1.5,50.);
    p=abs(p)*e-vec3(0.0,1.8,0.0);
    p.xz =.8-abs(p.xz-2.);
    p.y =1.7-abs(p.y-2.);
    s*=e=12./clamp(dot(p,p),1.0,50.);
    p=abs(p)*e-vec2(.2,1.0).xyx;
    p.y =1.5-abs(p.y-2.);
    s*=e=16./clamp(dot(p,p),.1,9.);
    p=abs(p)*e-vec2(.3,-.7).xyx;
    return min(
            length(p.xz)-.5,
            length(vec2(length(p.xz)-12.,p.y))-3.
            )/s;
  }
