// DEC SDF: vec3 rotate(vec3 p,vec3 axis,float theta){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-rotate-vec3-p-vec3-axis-float-theta.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 v = cross(axis,p), u = cross(v, axis);
    return u * cos(theta) + v * sin(theta) + axis * dot(p, axis);
  }

  vec2 pmod(vec2 p, float r){
    float a = mod(atan(p.y, p.x), (M_PI*2) / r) - 0.5 * (M_PI*2) / r;
    return length(p) * vec2(-sin(a), cos(a));
  }

  float de(vec3 p){
    for(int i=0;i<5;i++){
      p.xy = pmod43(p.xy,12.0); p.y-=4.0;
      p.yz = pmod43(p.yz,16.0); p.z-=6.8;
    }
    return dot(abs(p),rotate43(normalize(vec3(2.0,1.0,3.0)),
        normalize(vec3(7.0,1.0,2.0)),1.8))-0.3;
  }
