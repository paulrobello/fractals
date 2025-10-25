// DEC SDF: float de(vec3 p0){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p0-13.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec4 p = vec4(p0,3.);
    escape = 0.;
    p*= 2./min(dot(p.xyz,p.xyz),30.);
    for(int i = 0; i < 14; i++){
      p.xyz = vec3(2.,4.,2.)-(abs(p.xyz)-vec3(1.,4.,2.));
      p.xyz = mod(p.xyz-4., 8.)-4.;
      p *= 9./min(dot(p.xyz,p.xyz),12.);
      escape += exp(-0.2*dot(p.xyz,p.xyz));
    }
    p.xyz -= clamp(p.xyz, -1.2,1.2);
    return length(p.xyz)/p.w;
  }
