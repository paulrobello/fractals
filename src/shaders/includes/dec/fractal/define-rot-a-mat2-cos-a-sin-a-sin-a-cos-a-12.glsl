// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-12.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define Q(p) p*=rot(round(atan(p.y,p.x)/a)*a),
float de(vec3 p){
  float a = PI/8.0;
  for(int i=0;i++<5;)
    Q(p.yx)p.y-=1.,
    Q(p.zy)p.z-=1.;
  return.5*abs(length(p+p.zxy)-.05)+1e-3;
}

