// DEC SDF: Rhomboid Prism
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/rhomboid-prism.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float la = 0.15; // first axis
    float lb = 0.25; // second axis
    float h  = 0.04; // thickness
    float ra = 0.08; // corner radius

    p = abs(p);
    vec2 b = vec2(la,lb);
    vec2 bb = b-2.0*p.xz;

    float f = clamp((b.x*bb.x-b.y*bb.y)/dot(b,b), -1.0, 1.0 );
    vec2 q = vec2(length(p.xz-0.5*b*vec2(1.0-f,1.0+f))*sign(p.x*b.y+p.z*b.x-b.x*b.y)-ra, p.y-h);
    return min(max(q.x,q.y),0.0) + length(max(q,0.0));
  }
