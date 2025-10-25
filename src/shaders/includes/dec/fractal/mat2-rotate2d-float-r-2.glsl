// DEC SDF: mat2 rotate2D(float r){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rotate2d-float-r-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2(cos(r), sin(r), -sin(r), cos(r));
  }
  float de(vec3 p){
    vec3 R=p,Q;
    float i,d=1.,a;
    Q=R;
    d=a=1.5;
    for(int j=0;j++<9;)
      Q.xz=abs(Q.xz)*rotate2D(.785),
      d=min(d,(Q.x+Q.y*.5)/1.12/a),
      Q*=2., Q.x-=3., Q.y+=1.5,
      Q.yx*=rotate2D(.3),
      a*=2.;
    return d;
  }
