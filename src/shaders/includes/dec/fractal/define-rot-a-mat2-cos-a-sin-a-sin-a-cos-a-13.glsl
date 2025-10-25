// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-13.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define Q(p) p*=rotate2D(round(atan(p.y,p.x)/a)*a),
float de(vec3 p){
  float a=PI/8.0;
  for(int i=0;i++<3;)
    Q(p.yx)p.y-=.8,
    Q(p.zy)p.z-=.8;
  return .5*abs(length(vec2(length(p.xy)-.1,p.z))-.1)+1e-3;
}

