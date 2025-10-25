// DEC SDF: Cylinder with rounded edges, also in XZ plane
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/cylinder-with-rounded-edges-also-in-xz-plane.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p){
    float ra = 0.5;  // radius of cylinder
    float rb = 0.1;  // radius of rounding
    float h  = 0.4;  // height of cylinder

    vec2 d = vec2( length(p.xz)-2.0*ra+rb, abs(p.y) - h );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
  }
