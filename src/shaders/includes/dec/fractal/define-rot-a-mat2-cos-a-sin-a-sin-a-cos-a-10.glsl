// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-10.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
  float t = time;
  float s = 1.;
  p.z += t * .1;
  p+=.5;
  float c = length(mod(p, 1.)-.5)-.7;
  for(int i = 0; i < 12; i++) {
    p.xy*=rot(time * .01);
    p*=1.3;
    s*=1.3;
    c = max(c, -(length(mod(p, 1.)-.5)-.4)/s);
  }
  return c;
}

