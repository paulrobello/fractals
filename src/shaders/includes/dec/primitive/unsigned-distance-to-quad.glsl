// DEC SDF: Unsigned distance to quad
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/unsigned-distance-to-quad.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float dot2( in vec3 v ) { return dot(v,v); }
  float udQuad( in vec3 v1, in vec3 v2, in vec3 v3, in vec3 v4, in vec3 p )
  {
    // handle ill formed quads
    if( dot( cross( v2-v1, v4-v1 ), cross( v4-v3, v2-v3 )) < 0.0 )
    {
        vec3 tmp = v3;
        v3 = v4;
        v4 = tmp;
    }

    vec3 v21 = v2 - v1; vec3 p1 = p - v1;
    vec3 v32 = v3 - v2; vec3 p2 = p - v2;
    vec3 v43 = v4 - v3; vec3 p3 = p - v3;
    vec3 v14 = v1 - v4; vec3 p4 = p - v4;
    vec3 nor = cross( v21, v14 );

    return sqrt( (sign(dot(cross(v21,nor),p1)) +
                  sign(dot(cross(v32,nor),p2)) +
                  sign(dot(cross(v43,nor),p3)) +
                  sign(dot(cross(v14,nor),p4))<3.0)
                  ?
                  min( min( dot2(v21*clamp(dot(v21,p1)/dot2(v21),0.0,1.0)-p1),
                            dot2(v32*clamp(dot(v32,p2)/dot2(v32),0.0,1.0)-p2) ),
                       min( dot2(v43*clamp(dot(v43,p3)/dot2(v43),0.0,1.0)-p3),
                            dot2(v14*clamp(dot(v14,p4)/dot2(v14),0.0,1.0)-p4) ))
                  :
                  dot(nor,p1)*dot(nor,p1)/dot2(nor) );
  }
