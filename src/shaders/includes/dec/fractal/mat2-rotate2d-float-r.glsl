// DEC SDF: mat2 rotate2D(float r){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rotate2d-float-r.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2(cos(r), sin(r), -sin(r), cos(r));
  }
  float de(vec3 p){
    float d, a;
    d=a=1.;
    for(int j=0;j++<9;)
      p.xz=abs(p.xz)*rotate2D(PI/4.),
      d=min(d,max(length(p.zx)-.3,p.y-.4)/a),
      p.yx*=rotate2D(.5),
      p.y-=3.,
      p*=1.8,
      a*=1.8;
    return d;
  }
