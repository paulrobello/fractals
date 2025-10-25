// DEC SDF: Gyroid Torus
// Category: primitive | Author: dr2
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/gyroid-torus.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float rt = 15.;
    float rg = 4.;
    float ws = 0.3;

    p.xz = vec2(rt * atan (p.z, - p.x), length (p.xz) - rt);
    p.yz = vec2(rg * atan (p.z, - p.y), length (p.yz) - rg);
    return .6* max(abs(dot(sin(p), cos(p).yzx)) - ws, abs(p.z) - .5*PI);
  }
