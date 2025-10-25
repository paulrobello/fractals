// DEC SDF: float de(vec3 p){
// Category: fractal | Author: Ivan Dianov
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-38.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
    p.z-=.25;
    float j=0.,c=0.,s=1.;
    p.y = fract(p.y)-.5;
    for(;j<10.;j++){
      p=abs(p);
      p-=vec2(.05,.5).xyx;
      p.xz*=rot(1.6);
      p.yx*=rot(.24);
      p*=2.; s*=2.;
    }
    return (length(p)-1.)/s*.5;
  }
