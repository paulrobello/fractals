// DEC SDF: Rounded Cone - two spheres with convex connection
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/rounded-cone-two-spheres-with-convex-connection.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

Located at origin
  float de(vec3 p){
    float r1 = 1.0;
    float r2 = 0.1;
    float h = 3.; // height
    vec2 q = vec2( length(p.xz), p.y );

    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    float k = dot(q,vec2(-b,a));

    if( k < 0.0 ) return length(q) - r1;
    if( k > a*h ) return length(q-vec2(0.0,h)) - r2;

    return dot(q, vec2(a,b) ) - r1;
  }

Between two points
  float de(vec3 p){
    vec3 a = vec3(0.0,0.0,0.0);
    vec3 b = vec3(0.0,3.0,0.0);
    float r1 = 1.0; // radius at b
    float r2 = 0.1; // radius at a

    vec3  ba = b - a;
    float l2 = dot(ba,ba);
    float rr = r1 - r2;
    float a2 = l2 - rr*rr;
    float il2 = 1.0/l2;

    vec3 pa = p - a;
    float y = dot(pa,ba);
    float z = y - l2;
    vec3 d2 =  pa*l2 - ba*y;
    float x2 = dot(d2, d2);
    float y2 = y*y*l2;
    float z2 = z*z*l2;

    float k = sign(rr)*rr*rr*x2;
    if( sign(z)*a2*z2 > k ) return  sqrt(x2 + z2)        *il2 - r2;
    if( sign(y)*a2*y2 < k ) return  sqrt(x2 + y2)        *il2 - r1;
                            return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
  }
