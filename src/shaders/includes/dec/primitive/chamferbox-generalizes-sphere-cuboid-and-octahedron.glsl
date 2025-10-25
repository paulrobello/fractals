// DEC SDF: ChamferBox - generalizes sphere, cuboid, and octahedron
// Category: primitive | Author: TLC123
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/chamferbox-generalizes-sphere-cuboid-and-octahedron.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float sdOctahedron( in vec3 p, in float s)// by Iq 2019{
      p = abs(p);
      float m = p.x+p.y+p.z-s;
      vec3 q;
           if( 3.0*p.x < m ) q = p.xyz;
      else if( 3.0*p.y < m ) q = p.yzx;
      else if( 3.0*p.z < m ) q = p.zxy;
      else return m*0.57735027;

      float k = clamp(0.5*(q.z-q.y+s),0.0,s);
      return length(vec3(q.x,q.y-s+k,q.z-k));
  }

  float de(vec3 op){
    vec3 b = vec3(1.0,2.0,3.0); // size
    float ch = 0.25;      // chamfer amount
    float r = 0.05;       // rounding

    vec3 p = abs(op)+vec3(ch)+vec3(r);
    p = max(vec3(0.0),p-b);
    float d =fOctahedron(p,ch);
    return d-r ;
  }
