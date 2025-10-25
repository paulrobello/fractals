// DEC SDF: Rack Wheel
// Category: composed | Author: tholzer
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/rack-wheel.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define opRepeat(p,c) (mod(p,c)-0.5*c)
  #define opDifference(a,b) max(a,-b)

  float length2( vec2 p ) {
    return sqrt( p.x*p.x + p.y*p.y );
  }

  float length8( vec2 p ) {
    p = p*p; p = p*p; p = p*p;
    return pow( p.x + p.y, 1.0/8.0 );
  }

  float sdCylinder (in vec3 p, in vec2 h ){
  vec2 d = abs(vec2(length(p.xz), p.y)) - h;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }


  float sdTorus82( vec3 p, vec2 t ){
    vec2 q = vec2(length2(p.xz)-t.x, p.y);
    return length8(q) - t.y;
  }

  float de( in vec3 pos){
    return opDifference(sdTorus82(pos, vec2(0.20, 0.1)),
      sdCylinder (opRepeat (vec3(atan(pos.x, pos.z)/6.2831
                                  ,pos.y
                                  ,0.02+0.5*length(pos))
                            ,vec3(0.05, 1.0, 0.05))
                  ,vec2(0.02, 0.6)));
  }
