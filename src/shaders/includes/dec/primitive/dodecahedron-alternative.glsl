// DEC SDF: Dodecahedron (Alternative)
// Category: primitive | Author: tholzer
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/dodecahedron-alternative.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float radius = 1.;
    const float phi = 1.61803398875;  // Golden Ratio = (sqrt(5)+1)/2;
    const vec3 n = normalize(vec3(phi,1.0,0.0));

    p = abs(p / radius);
    float a = dot(p, n.xyz);
    float b = dot(p, n.zxy);
    float c = dot(p, n.yzx);
    return (max(max(a,b),c)-n.x) * radius;
  }
