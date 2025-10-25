// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-54.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q;
    float s=1., a=1., n=.5;
    for(int j=0;j++<9;){
      p.xy*=rotate2D(float(j*j));
      a*=.5; q=sin(p+=p);
      n+=q.x*q.y*q.z*a;
    }
    return n*.2;
  }
