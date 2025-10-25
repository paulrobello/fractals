// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: i_dianov
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-7.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define decartToPolar(d) vec2(atan(d.x,d.y),length(d))
#define PI (atan(1.)*4.)
#define LOOPS 16.
#define LOOP_ANGLE_SPAN (PI/LOOPS)
#define THREAD_R .035
#define LOOP_R .2
#define COHESION (LOOP_R*.6)
#define TUBE_R 1.
float spiral(vec3 p) {
  p.z+=atan(p.y,p.x)/PI*LOOP_ANGLE_SPAN;
  p.z=mod(p.z,LOOP_ANGLE_SPAN*2.)-LOOP_ANGLE_SPAN;
  return length(vec2(length(p.xy)-LOOP_R,p.z))-THREAD_R;
}
float de(vec3 p){
  vec3 pp = p;
  p.y = mod(p.y, 4.*LOOP_R-2.*COHESION)-2.*LOOP_R+COHESION;
  p.xz = decartToPolar(p.xz);
  p.z -= TUBE_R;
  p.xz*=rot(PI/2.);
  float s1 = spiral(p + vec3(0.0, 0.0, LOOP_ANGLE_SPAN));
  float s2 = spiral(p + vec3(0.0, +2.*LOOP_R-COHESION, 0.0));
  float s3 = spiral(p + vec3(0.0, -2.*LOOP_R+COHESION, 0.0));
  return min(s1, min(s2, s3));
}

