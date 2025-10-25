// DEC SDF: IcoDodecaStar
// Category: composed | Author: tholzer
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/icododecastar.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

// Dodecahedron: radius = circumsphere radius
  float sdDodecahedron(vec3 p, float radius){
    const float phi = 1.61803398875;  // Golden Ratio = (sqrt(5)+1)/2;
    const vec3 n = normalize(vec3(phi,1.0,0.0));

    p = abs(p / radius);
    float a = dot(p, n.xyz);
    float b = dot(p, n.zxy);
    float c = dot(p, n.yzx);
    return (max(max(a,b),c)-n.x) * radius;
  }
  // Icosahedron: radius = circumsphere radius
  float sdIcosahedron(vec3 p, float radius){
    const float q = 2.61803398875;  // Golden Ratio + 1 = (sqrt(5)+3)/2;
    const vec3 n1 = normalize(vec3(q,1.0,0.0));
    const vec3 n2 = vec3(0.57735026919);  // = sqrt(3)/3);

    p = abs(p / radius);
    float a = dot(p, n1.xyz);
    float b = dot(p, n1.zxy);
    float c = dot(p, n1.yzx);
    float d = dot(p, n2) - n1.x;
    return max(max(max(a,b),c)-n1.x,d) * radius;
  }
  float de(vec3 p){
    float radius = 0.5;
    return min(sdDodecahedron(p,radius),  sdIcosahedron(p.zyx,radius));
  }
