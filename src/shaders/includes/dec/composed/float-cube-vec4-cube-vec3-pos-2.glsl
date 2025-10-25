// DEC SDF: float cube(vec4 cube, vec3 pos){
// Category: composed | Author: psonice
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-cube-vec4-cube-vec3-pos-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

cube.xyz -= pos;
  return max(max(abs(cube.x)-cube.w,abs(cube.y)-cube.w),abs(cube.z)-cube.w);
}

int m; // material id
float df(vec3 p){
  float t = time; // time varying term
  p += vec3(
    sin(p.z * 1.55 + t) + sin(p.z * 1.34 + t),
    0.,
    sin(p.x * 1.34 + t) + sin(p.x * 1.55 + t)
  ) * .5;
  vec3 mp = mod(p, 1.);
  mp.y = p.y;
  
  float s1 = cube(
    vec4(0.5, 0.5, 0.5, 0.15),
    vec3(mp.x, mp.y + (sin(p.z * PI) * sin(p.x * PI)) * 0.25, 0.5));
  float s2 = cube(
    vec4(0.5, 0.5, 0.5, 0.15), 
    vec3(0.5, mp.y + (sin(p.x * PI) * -sin(p.z * PI)) * 0.25, mp.z));
  m = s1 < s2 ? 0 : 1;
  return min(s1, s2);
}

