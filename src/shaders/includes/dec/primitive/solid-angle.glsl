// DEC SDF: Solid Angle
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/solid-angle.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float angle = 1.; // desired cone angle
    float ra = 1.; // radius of the sphere from which it is cut

    vec2 c = vec2(sin(angle),cos(angle));
    vec2 p0 = vec2( length(p.xz), p.y );
    float l = length(p0) - ra;
    float m = length(p0 - c*clamp(dot(p0,c),0.0,ra) );
    return max(l,m*sign(c.y*p0.x-c.x*p0.y));
  }
