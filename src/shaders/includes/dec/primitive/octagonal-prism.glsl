// DEC SDF: Octagonal Prism
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/octagonal-prism.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float r = 2.;   // diameter
    float h = 0.2;  // thickness

    const vec3 k = vec3(-0.9238795325,   // sqrt(2+sqrt(2.0))/2
                         0.3826834323,   // sqrt(2-sqrt(2))/2
                         0.4142135623 ); // sqrt(2)-1
    // reflections
    p = abs(p);
    p.xy -= 2.0*min(dot(vec2( k.x,k.y),p.xy),0.0)*vec2( k.x,k.y);
    p.xy -= 2.0*min(dot(vec2(-k.x,k.y),p.xy),0.0)*vec2(-k.x,k.y);
    // polygon side
    p.xy -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    vec2 d = vec2( length(p.xy)*sign(p.y), p.z-h );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
  }
