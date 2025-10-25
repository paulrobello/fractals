// DEC SDF: float cube(vec4 cube, vec3 pos){
// Category: composed | Author: psonice
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-cube-vec4-cube-vec3-pos.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

cube.xyz -= pos;
  return max(max(abs(cube.x)-cube.w,abs(cube.y)-cube.w),abs(cube.z)-cube.w);
}

int m; // material id
float de(vec3 p){
  float t = time; // time varying term
  vec3 mp = mod(p, 0.1);
  mp.y = p.y + sin(p.x*2.+t)*.25 + sin(p.z * 2.5 + t)*.25;
  float s1 = cube(
    vec4(0.05, 0.05, 0.05, 0.025),
    vec3(mp.x, mp.y + (sin(p.z * PI * 10.) * sin(p.x * PI * 10.)) * 0.025, 0.05));
  float s2 = cube(
    vec4(0.05, 0.05, 0.05, 0.025), 
    vec3(0.05, mp.y + (sin(p.x * PI * 10.) * -sin(p.z * PI * 10.)) * 0.025, mp.z));
  m = s1 < s2 ? 0 : 1;
  return min(s1, s2);
}




