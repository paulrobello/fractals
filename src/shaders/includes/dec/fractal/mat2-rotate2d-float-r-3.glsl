// DEC SDF: mat2 rotate2D ( float r ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rotate2d-float-r-3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2( cos( r ), sin( r ), -sin( r ), cos( r ) );
}
float de(vec3 p){
  float e, s = 1.0;
  for( e = p.y += 2.0; s > 0.01; s *= 0.77 )
    p.x=abs(p.x),
    e=min(e,max(abs(p.y-s*.5)-s*.4,length(p.xz))-s*.1),
    p.y-=s,
    p.xz*=rotate2D(1.6),
    p.zy*=rotate2D(.7);
  return e*.8;
}

