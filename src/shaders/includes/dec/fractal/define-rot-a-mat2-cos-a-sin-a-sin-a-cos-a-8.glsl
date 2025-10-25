// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: i_dianov
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-8.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define PI (atan(1.)*4.)
#define THREAD_R .035
#define LOOP_R .1
float coilSlice(vec3 p) {
  p.xy+=vec2(LOOP_R,0.0)*rot(p.z);
  p.x = mod(p.x, 2.*LOOP_R)-LOOP_R;
  return length(p.xy);
}
float de(vec3 p){
  p.z*=10.;
  float tissue = min(
    coilSlice(vec3(p.xy,p.z)),
    coilSlice(vec3(p.xy+vec2(LOOP_R, 0.),p.z+PI))
  )-THREAD_R;
  return tissue*.9;
}
