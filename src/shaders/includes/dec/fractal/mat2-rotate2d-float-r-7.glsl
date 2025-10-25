// DEC SDF: mat2 rotate2D ( float r ) {
// Category: fractal | Author: tk87
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rotate2d-float-r-7.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2(cos(r), sin(r), -sin(r), cos(r));
}
float de ( vec3 p ) {
  float d = 0;
  p.z+=3.;
  for(int i=0;++i<10;)
    p.y-=clamp(p.y,.0,.3),
    p.xz-=.05,
    p=abs(p),
    p.yx*=rotate2D(.6),
    p.zx*=rotate2D(1.4),
    p*=1.1;
    d=length(p)-.05;
    d*=.39;
  return d;
}

