// DEC SDF: mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
// Category: fractal | Author: leon
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rot-float-a-float-c-cos-a-s-sin-a-return-mat2-c-s-s-c.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float gyroid (vec3 p) { return dot(cos(p),sin(p.yzx)); }
float fbm( vec3 p ) {
  float result = 0.;
  float a = .5;
  for (float i = 0.; i < 3.; ++i)
  {
    p += result;
    p.z += time*.2;
    result += abs(gyroid(p/a)*a);
    a /= 2.;
  }
  return result;
}

float de( vec3 p ) {
  float dist = 100.0f;
  p.xz *= rot(time * .2);
  p.xy *= rot(time * .1);
  vec3 q = p;
  
  p = abs(p)-1.3;
  dist = max(p.x, max(p.y, p.z));
  dist -= fbm(q)*.2;
  dist = abs(dist)-.03;
  
  return dist * .5;
}

