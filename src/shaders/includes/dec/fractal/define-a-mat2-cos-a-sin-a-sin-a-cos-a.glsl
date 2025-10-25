// DEC SDF: #define _(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-a-mat2-cos-a-sin-a-sin-a-cos-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define q(p) length(vec2(mod(p.x,.4)-.2,p.y+sin(t)))
#define R(x) vec2(.3,0.0)*_((p.z+t)*9.+x)
float de(vec3 p){
  float t=time;
  return min(q((p.xy+R(0.))),q((p.xy+R(3.14))))*.2;
}

