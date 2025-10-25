// DEC SDF: Unsigned distance to triangle
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/unsigned-distance-to-triangle.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float dot2( in vec3 v ) { return dot(v,v); }
  float de( in vec3 v1, in vec3 v2, in vec3 v3, in vec3 p )
  {
    // prepare data
    vec3 v21 = v2 - v1; vec3 p1 = p - v1;
    vec3 v32 = v3 - v2; vec3 p2 = p - v2;
    vec3 v13 = v1 - v3; vec3 p3 = p - v3;
    vec3 nor = cross( v21, v13 );

    return sqrt( // inside/outside test
                 (sign(dot(cross(v21,nor),p1)) +
                  sign(dot(cross(v32,nor),p2)) +
                  sign(dot(cross(v13,nor),p3))<2.0)
                  ?
                  // 3 edges
                  min( min(
                  dot2(v21*clamp(dot(v21,p1)/dot2(v21),0.0,1.0)-p1),
                  dot2(v32*clamp(dot(v32,p2)/dot2(v32),0.0,1.0)-p2) ),
                  dot2(v13*clamp(dot(v13,p3)/dot2(v13),0.0,1.0)-p3) )
                  :
                  // 1 face
                  dot(nor,p1)*dot(nor,p1)/dot2(nor) );
  }
