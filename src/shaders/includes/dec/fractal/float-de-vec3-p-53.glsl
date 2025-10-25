// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-53.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 z,q;
    p.z -= 9.; z=p;
    float a=1.,n=.9;
    for(int j=0;j++<15;){
      p.xy*=rotate2D(float(j*j));
      a*=.66;
      q=sin(p*=1.5);
      n+=q.x*q.y*q.z*a;
    }
    return (n*.2-z.z*.2);
  }
