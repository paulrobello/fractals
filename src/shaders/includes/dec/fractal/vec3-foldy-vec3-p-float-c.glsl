// DEC SDF: vec3 foldY(vec3 P, float c){
// Category: fractal | Author: guil
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-foldy-vec3-p-float-c.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float r = length(P.xz);
    float a = atan(P.z, P.x);
    a = mod(a, 2.0 * c) - c;
    P.x = r * cos(a);
    P.z = r * sin(a);
    return P;
  }

  float de(vec3 p){
    float l= length(p)-1.;
    float dr = 1.0, g = 1.25;
    vec4 ot=vec4(.3,.5,0.21,1.);
    ot = vec4(1.);
    mat3 tr = rotate3D(-0.55, normalize(vec3(-1., -1., -0.5)));

    for(int i=0;i<15;i++) {
      if(i-(i/3)*5==0)
      p = foldY(p, .95);
      p.yz = abs(p.yz);
      p = tr * p * g -1.;
      dr *= g;
      ot=min(ot,vec4(abs(p),dot(p,p)));
      l = min (l ,(length(p)-1.) / dr);
    }
    return l;
  }
